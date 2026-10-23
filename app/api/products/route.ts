import { NextResponse, NextRequest } from "next/server";
import pool from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { requireApiAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireApiAuth();

    if (!auth.user) {
      return auth.response!;
    }

    const currentUser = auth.user;
    
    const search = req.nextUrl.searchParams.get("search") || "";

    let query = `
      SELECT *
      FROM products
      WHERE business_id = ?
    `;

    const values: any[] = [currentUser.business_id];

    if (search.trim()) {
      query += `
        AND (
          CAST(id AS CHAR) LIKE ?
          OR name LIKE ?
        )
      `;

      values.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY id ASC`;

    const [rows] = await pool.query(query, values);

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Failed to fetch products:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch products",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireApiAuth();

    if (!auth.user) {
      return auth.response!;
    }

    const currentUser = auth.user;
    const body = await req.json();

    if (!body.name || !String(body.name).trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Product name is required",
        },
        { status: 400 }
      );
    }

    const [result] = await pool.query(
      `
      INSERT INTO products (
        business_id,
        sku,
        name,
        price,
        vat_rate,
        stock_quantity,
        is_active,
        type,
        category,
        cost,
        sales_description,
        purchase_description,
        reorder_point,
        income_account,
        expense_account,
        inventory_account
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        currentUser.business_id,
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
      ]
    );

    const productId = (result as any).insertId;

    await logAudit({
      userId: currentUser.id,
      action: "CREATE",
      entityName: "products",
      recordId: productId,
      newValues: {
        ...body,
        business_id: currentUser.business_id,
      },
    });

    return NextResponse.json({
      success: true,
      productId,
    });
  } catch (error) {
    console.error("Failed to create product:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create product",
      },
      { status: 500 }
    );
  }
}