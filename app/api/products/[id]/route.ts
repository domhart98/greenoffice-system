import { NextResponse, NextRequest } from "next/server";
import pool from "@/lib/db";
import { requireApiAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function isBusinessAdmin(role: string) {
  return role === "OWNER" || role === "ADMIN";
}

export async function GET(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    const auth = await requireApiAuth();

    if (!auth.user) {
      return auth.response!;
    }

    const currentUser = auth.user;
    const { id } = await params;
    const productId = Number(id);

    if (!Number.isInteger(productId) || productId < 1) {
      return NextResponse.json(
        { success: false, error: "Invalid product ID" },
        { status: 400 }
      );
    }

    const [productRows]: any = await pool.query(
      `
      SELECT *
      FROM products
      WHERE id = ?
        AND business_id = ?
      `,
      [productId, currentUser.business_id]
    );

    if (productRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      product: productRows[0],
    });
  } catch (error) {
    console.error("Failed to fetch product:", error);

    return NextResponse.json(
      { success: false, error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    const auth = await requireApiAuth();

    if (!auth.user) {
      return auth.response!;
    }

    const currentUser = auth.user;

    if (!isBusinessAdmin(currentUser.business_role)) {
      return NextResponse.json(
        {
          success: false,
          error: "You are not authorized to update products.",
        },
        { status: 403 }
      );
    }

    const { id } = await params;
    const productId = Number(id);

    if (!Number.isInteger(productId) || productId < 1) {
      return NextResponse.json(
        { success: false, error: "Invalid product ID" },
        { status: 400 }
      );
    }

    const body = await req.json();

    if (!body.name || !String(body.name).trim()) {
      return NextResponse.json(
        { success: false, error: "Product name is required" },
        { status: 400 }
      );
    }

    const [oldRows]: any = await pool.query(
      `
      SELECT *
      FROM products
      WHERE id = ?
        AND business_id = ?
      `,
      [productId, currentUser.business_id]
    );

    if (oldRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    const oldProduct = oldRows[0];

    await pool.query(
      `
      UPDATE products
      SET
        sku = ?,
        name = ?,
        price = ?,
        vat_rate = ?,
        stock_quantity = ?,
        is_active = ?,
        type = ?,
        category = ?,
        cost = ?,
        sales_description = ?,
        purchase_description = ?,
        reorder_point = ?,
        income_account = ?,
        expense_account = ?,
        inventory_account = ?
      WHERE id = ?
        AND business_id = ?
      `,
      [
        body.sku ?? null,
        String(body.name).trim(),
        body.price ?? 0,
        body.vat_rate ?? 0,
        body.stock_quantity ?? 0,
        body.is_active ?? 1,
        body.type ?? "PRODUCT",
        body.category ?? null,
        body.cost ?? null,
        body.sales_description ?? null,
        body.purchase_description ?? null,
        body.reorder_point ?? 0,
        body.income_account ?? null,
        body.expense_account ?? null,
        body.inventory_account ?? null,
        productId,
        currentUser.business_id,
      ]
    );

    await logAudit({
      userId: currentUser.id,
      action: "UPDATE",
      entityName: "products",
      recordId: productId,
      oldValues: oldProduct,
      newValues: {
        ...body,
        business_id: currentUser.business_id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update product:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update product",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    const auth = await requireApiAuth();

    if (!auth.user) {
      return auth.response!;
    }

    const currentUser = auth.user;

    if (!isBusinessAdmin(currentUser.business_role)) {
      return NextResponse.json(
        {
          success: false,
          error: "You are not authorized to delete products.",
        },
        { status: 403 }
      );
    }

    const { id } = await params;
    const productId = Number(id);

    if (!Number.isInteger(productId) || productId < 1) {
      return NextResponse.json(
        { success: false, error: "Invalid product ID" },
        { status: 400 }
      );
    }
    
    const [productRows]: any = await pool.query(
      `
      SELECT *
      FROM products
      WHERE id = ?
        AND business_id = ?
      `,
      [productId, currentUser.business_id]
    );

    if (productRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    const oldProduct = productRows[0];

    await pool.query(
      `
      DELETE FROM products
      WHERE id = ?
        AND business_id = ?
      `,
      [productId, currentUser.business_id]
    );

    await logAudit({
      userId: currentUser.id,
      action: "DELETE",
      entityName: "products",
      recordId: productId,
      oldValues: oldProduct,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete product:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete product",
      },
      { status: 500 }
    );
  }
}