import { NextResponse, NextRequest } from "next/server";
import pool from "@/lib/db";
import { requireApiAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function isBusinessAdmin(business_role: string) {
  return business_role === "OWNER" || business_role === "ADMIN";
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

    const { id } = await params;
    const customerId = Number(id);

    if (!Number.isInteger(customerId) || customerId < 1) {
      return NextResponse.json(
        { success: false, error: "Invalid customer ID" },
        { status: 400 }
      );
    }

    const [rows]: any = await pool.query(
      `
      SELECT *
      FROM customers
      WHERE id = ?
        AND business_id = ?
      `,
      [customerId, auth.user.business_id]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ customer: rows[0] });
  } catch (error) {
    console.error("Failed to fetch customer:", error);

    return NextResponse.json(
      { success: false, error: "Failed to fetch customer" },
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
          error: "You are not authorized to update customers.",
        },
        { status: 403 }
      );
    }

    const { id } = await params;
    const customerId = Number(id);

    if (!Number.isInteger(customerId) || customerId < 1) {
      return NextResponse.json(
        { success: false, error: "Invalid customer ID" },
        { status: 400 }
      );
    }

    const body = await req.json();

    if (!body.name || !String(body.name).trim()) {
      return NextResponse.json(
        { success: false, error: "Customer name is required" },
        { status: 400 }
      );
    }

    const [oldRows]: any = await pool.query(
      `
      SELECT *
      FROM customers
      WHERE id = ?
        AND business_id = ?
      `,
      [customerId, currentUser.business_id]
    );

    if (oldRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Customer not found" },
        { status: 404 }
      );
    }

    const oldCustomer = oldRows[0];

    await pool.query(
      `
      UPDATE customers
      SET
        name = ?,
        address = ?,
        phone = ?,
        email = ?,
        notes = ?,
        company_name = ?,
        city = ?,
        state = ?,
        country = ?,
        postal_code = ?,
        open_balance = ?
      WHERE id = ?
        AND business_id = ?
      `,
      [
        String(body.name).trim(),
        body.address ?? null,
        body.phone ?? null,
        body.email ?? null,
        body.notes ?? null,
        body.company_name ?? null,
        body.city ?? null,
        body.state ?? null,
        body.country ?? null,
        body.postal_code ?? null,
        body.open_balance ?? 0,
        customerId,
        currentUser.business_id,
      ]
    );

    await logAudit({
      userId: currentUser.id,
      action: "UPDATE",
      entityName: "customers",
      recordId: customerId,
      oldValues: oldCustomer,
      newValues: {
        ...body,
        business_id: currentUser.business_id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update customer:", error);

    return NextResponse.json(
      { success: false, error: "Failed to update customer" },
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
          error: "You are not authorized to delete customers.",
        },
        { status: 403 }
      );
    }

    const { id } = await params;
    const customerId = Number(id);

    if (!Number.isInteger(customerId) || customerId < 1) {
      return NextResponse.json(
        { success: false, error: "Invalid customer ID" },
        { status: 400 }
      );
    }

    const [customerRows]: any = await pool.query(
      `
      SELECT *
      FROM customers
      WHERE id = ?
        AND business_id = ?
      `,
      [customerId, currentUser.business_id]
    );

    if (customerRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Customer not found" },
        { status: 404 }
      );
    }

    const oldCustomer = customerRows[0];

    const [invoiceRows]: any = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM invoices
      WHERE customer_id = ?
        AND business_id = ?
      `,
      [customerId, currentUser.business_id]
    );

    if (Number(invoiceRows[0].total) > 0) {
      return NextResponse.json(
        { error: "Cannot delete: customer has invoices" },
        { status: 400 }
      );
    }

    await pool.query(
      `
      DELETE FROM customers
      WHERE id = ?
        AND business_id = ?
      `,
      [customerId, currentUser.business_id]
    );

    await logAudit({
      userId: currentUser.id,
      action: "DELETE",
      entityName: "customers",
      recordId: customerId,
      oldValues: oldCustomer,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete customer:", error);

    return NextResponse.json(
      { success: false, error: "Failed to delete customer" },
      { status: 500 }
    );
  }
}
