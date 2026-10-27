import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireApiAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function canManageSuppliers(business_role: string | undefined) {
  return business_role === "OWNER" || business_role === "ADMIN";
}

export async function GET(
  req: NextRequest,
  { params }: RouteContext
) {
  const auth = await requireApiAuth();

  if (auth.response) {
    return auth.response;
  }

  const currentUser = auth.user;

  if (!currentUser) {
    return;
  }

  try {
    const { id } = await params;
    const supplierId = Number(id);

    if (!Number.isInteger(supplierId) || supplierId <= 0) {
      return NextResponse.json(
        { error: "Invalid supplier ID" },
        { status: 400 }
      );
    }

    const [supplierRows]: any = await pool.query(
      `
      SELECT *
      FROM suppliers
      WHERE id = ?
        AND business_id = ?
      LIMIT 1
      `,
      [supplierId, currentUser.business_id]
    );

    if (supplierRows.length === 0) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      supplier: supplierRows[0],
    });
  } catch (error) {
    console.error("Error fetching supplier:", error);

    return NextResponse.json(
      { error: "Failed to fetch supplier" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: RouteContext
) {
  const auth = await requireApiAuth();

  if (auth.response) {
    return auth.response;
  }

  const currentUser = auth.user;

  if (!currentUser) {
    return;
  }

  if (!canManageSuppliers(currentUser.business_role)) {
    return NextResponse.json(
      {
        success: false,
        error: "You are not authorized to update suppliers.",
      },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const supplierId = Number(id);

    if (!Number.isInteger(supplierId) || supplierId <= 0) {
      return NextResponse.json(
        { error: "Invalid supplier ID" },
        { status: 400 }
      );
    }

    const body = await req.json();

    // Retrieve the existing supplier within the current business.
    const [oldRows]: any = await pool.query(
      `
      SELECT *
      FROM suppliers
      WHERE id = ?
        AND business_id = ?
      LIMIT 1
      `,
      [supplierId, currentUser.business_id]
    );

    if (oldRows.length === 0) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    const oldSupplier = oldRows[0];

    await pool.query(
      `
      UPDATE suppliers
      SET
        name = ?,
        company_name = ?,
        address = ?,
        city = ?,
        state = ?,
        country = ?,
        postal_code = ?,
        phone = ?,
        email = ?,
        open_balance = ?
      WHERE id = ?
        AND business_id = ?
      `,
      [
        body.name,
        body.company_name,
        body.address,
        body.city,
        body.state,
        body.country,
        body.postal_code,
        body.phone,
        body.email,
        body.open_balance,
        supplierId,
        currentUser.business_id,
      ]
    );

    await logAudit({
      userId: currentUser.id,
      action: "UPDATE",
      entityName: "suppliers",
      recordId: supplierId,
      oldValues: oldSupplier,
      newValues: body,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating supplier:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update supplier",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: RouteContext
) {
  const auth = await requireApiAuth();

  if (auth.response) {
    return auth.response;
  }

  const currentUser = auth.user;

  if (!currentUser) {
    return;
  }

  if (!canManageSuppliers(currentUser.business_role)) {
    return NextResponse.json(
      {
        success: false,
        error: "You are not authorized to delete suppliers.",
      },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const supplierId = Number(id);

    if (!Number.isInteger(supplierId) || supplierId <= 0) {
      return NextResponse.json(
        { error: "Invalid supplier ID" },
        { status: 400 }
      );
    }

    const [supplierRows]: any = await pool.query(
      `
      SELECT *
      FROM suppliers
      WHERE id = ?
        AND business_id = ?
      LIMIT 1
      `,
      [supplierId, currentUser.business_id]
    );

    if (supplierRows.length === 0) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    const oldSupplier = supplierRows[0];

    await pool.query(
      `
      DELETE FROM suppliers
      WHERE id = ?
        AND business_id = ?
      `,
      [supplierId, currentUser.business_id]
    );

    await logAudit({
      userId: currentUser.id,
      action: "DELETE",
      entityName: "suppliers",
      recordId: supplierId,
      oldValues: oldSupplier,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting supplier:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete supplier",
      },
      { status: 500 }
    );
  }
}