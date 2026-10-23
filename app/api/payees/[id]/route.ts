import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireApiAuth } from "@/lib/auth";
import { RowDataPacket } from "mysql2";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const canManagePayees = (role: string) =>
  role === "OWNER" || role === "ADMIN";


export async function GET(
  request: Request,
  { params }: RouteContext
) {
  const auth = await requireApiAuth();

  if (auth.user) {
    return auth.response;
  }

  const currentUser = auth.user;
  const { id } = await params;
  const payeeId = Number(id);

  if (!Number.isInteger(payeeId) || payeeId <= 0) {
    return NextResponse.json(
      { error: "Invalid payee ID" },
      { status: 400 }
    );
  }

  try {
    const [rows] = await pool.query(
      `
      SELECT
        p.id,
        p.name,
        p.payee_type,
        p.supplier_id,
        p.employee_id,
        p.created_at,
        p.updated_at
      FROM payees p
      WHERE p.id = ?
        AND p.business_id = ?
      LIMIT 1
      `,
      [payeeId, currentUser.business_id]
    );

    const payees = rows as RowDataPacket[];

    if (payees.length === 0) {
      return NextResponse.json(
        { error: "Payee not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(payees[0]);
  } catch (error) {
    console.error("Error fetching payee:", error);

    return NextResponse.json(
      { error: "Failed to fetch payee" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  context: RouteContext
) {
  const auth = await requireApiAuth();

  if (!auth.user) {
    return auth.response!;
  }

  const currentUser = auth.user;

  if (!canManagePayees(currentUser.business_role)) {
    return NextResponse.json(
      { error: "You are not authorized to update payees." },
      { status: 403 }
    );
  }

  const { id } = await context.params;
  const payeeId = Number(id);

  if (!Number.isInteger(payeeId) || payeeId <= 0) {
    return NextResponse.json(
      { error: "Invalid payee ID" },
      { status: 400 }
    );
  }

  const connection = await pool.getConnection();
  let transactionStarted = false;

  try {
    const body = await req.json();

    const {
      name,
      payee_type,
      supplier_id,
      employee_id,
      company_name,
      address,
      phone,
      email,
    } = body;

    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Payee name is required" },
        { status: 400 }
      );
    }

    if (!["SUPPLIER", "EMPLOYEE", "OTHER"].includes(payee_type)) {
      return NextResponse.json(
        { error: "Invalid payee type" },
        { status: 400 }
      );
    }

    if (payee_type === "SUPPLIER" && !supplier_id) {
      return NextResponse.json(
        { error: "Supplier is required for a supplier payee" },
        { status: 400 }
      );
    }

    if (payee_type === "EMPLOYEE" && !employee_id) {
      return NextResponse.json(
        { error: "Employee is required for an employee payee" },
        { status: 400 }
      );
    }

    await connection.beginTransaction();
    transactionStarted = true;

    // Confirm the payee belongs to this business before updating it.
    const [existing] = await connection.query(
      `
      SELECT id
      FROM payees
      WHERE id = ?
        AND business_id = ?
      FOR UPDATE
      `,
      [payeeId, currentUser.business_id]
    );

    if ((existing as any[]).length === 0) {
      await connection.rollback();
      transactionStarted = false;

      return NextResponse.json(
        { error: "Payee not found" },
        { status: 404 }
      );
    }

    // Verify supplier ownership.
    if (payee_type === "SUPPLIER") {
      const [suppliers] = await connection.query(
        `
        SELECT id
        FROM suppliers
        WHERE id = ?
          AND business_id = ?
        FOR UPDATE
        `,
        [supplier_id, currentUser.business_id]
      );

      if ((suppliers as any[]).length === 0) {
        await connection.rollback();
        transactionStarted = false;

        return NextResponse.json(
          { error: "Supplier not found" },
          { status: 400 }
        );
      }
    }

    // Verify employee ownership.
    if (payee_type === "EMPLOYEE") {
      const [employees] = await connection.query(
        `
        SELECT id
        FROM employees
        WHERE id = ?
          AND business_id = ?
        FOR UPDATE
        `,
        [employee_id, currentUser.business_id]
      );

      if ((employees as any[]).length === 0) {
        await connection.rollback();
        transactionStarted = false;

        return NextResponse.json(
          { error: "Employee not found" },
          { status: 400 }
        );
      }
    }

    await connection.query(
      `
      UPDATE payees
      SET
        name = ?,
        payee_type = ?,
        supplier_id = ?,
        employee_id = ?,
        company_name = ?,
        address = ?,
        phone = ?,
        email = ?
      WHERE id = ?
        AND business_id = ?
      `,
      [
        name.trim(),
        payee_type,
        payee_type === "SUPPLIER" ? supplier_id : null,
        payee_type === "EMPLOYEE" ? employee_id : null,
        company_name || null,
        address || null,
        phone || null,
        email || null,
        payeeId,
        currentUser.business_id,
      ]
    );

    await connection.commit();
    transactionStarted = false;

    return NextResponse.json({
      success: true,
      payee_id: payeeId,
    });
  } catch (error: any) {
    if (transactionStarted) {
      await connection.rollback();
    }

    console.error("Error updating payee:", error);

    return NextResponse.json(
      { error: error.message || "Failed to update payee" },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}

// ============================================================
// DELETE /api/payees/[id]
// Delete a payee only if it belongs to this business and
// is not referenced by any of its expenses.
// ============================================================
export async function DELETE(
  _req: NextRequest,
  context: RouteContext
) {
  const auth = await requireApiAuth();

  if (!auth.user) {
    return auth.response!;
  }

  const currentUser = auth.user;

  if (!canManagePayees(currentUser.business_role)) {
    return NextResponse.json(
      { error: "You are not authorized to delete payees." },
      { status: 403 }
    );
  }

  const { id } = await context.params;
  const payeeId = Number(id);

  if (!Number.isInteger(payeeId) || payeeId <= 0) {
    return NextResponse.json(
      { error: "Invalid payee ID" },
      { status: 400 }
    );
  }

  const connection = await pool.getConnection();
  let transactionStarted = false;

  try {
    await connection.beginTransaction();
    transactionStarted = true;

    // Lock only a payee belonging to this business.
    const [payees] = await connection.query(
      `
      SELECT id
      FROM payees
      WHERE id = ?
        AND business_id = ?
      FOR UPDATE
      `,
      [payeeId, currentUser.business_id]
    );

    if ((payees as any[]).length === 0) {
      await connection.rollback();
      transactionStarted = false;

      return NextResponse.json(
        { error: "Payee not found" },
        { status: 404 }
      );
    }

    // Only consider expenses belonging to this business.
    const [expenses] = await connection.query(
      `
      SELECT COUNT(*) AS count
      FROM expenses
      WHERE payee_id = ?
        AND business_id = ?
      `,
      [payeeId, currentUser.business_id]
    );

    const expenseCount = Number((expenses as any[])[0].count);

    if (expenseCount > 0) {
      await connection.rollback();
      transactionStarted = false;

      return NextResponse.json(
        {
          error:
            "This payee cannot be deleted because it is used by existing expenses.",
        },
        { status: 409 }
      );
    }

    await connection.query(
      `
      DELETE FROM payees
      WHERE id = ?
        AND business_id = ?
      `,
      [payeeId, currentUser.business_id]
    );

    await connection.commit();
    transactionStarted = false;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (transactionStarted) {
      await connection.rollback();
    }

    console.error("Error deleting payee:", error);

    return NextResponse.json(
      { error: error.message || "Failed to delete payee" },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}