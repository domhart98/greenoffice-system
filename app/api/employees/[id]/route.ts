import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireApiAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function canManageEmployees(role: string | undefined) {
  return role === "OWNER" || role === "ADMIN";
}

// GET: Fetch a single employee belonging to the current business
export async function GET(
  req: NextRequest,
  { params }: RouteContext
) {
  const auth = await requireApiAuth();

  if (auth.response) {
    return auth.response;
  }

  const currentUser = auth.user;

  try {
    const { id } = await params;
    const employeeId = Number(id);

    if (!Number.isInteger(employeeId) || employeeId <= 0) {
      return NextResponse.json(
        { error: "Invalid employee ID" },
        { status: 400 }
      );
    }

    const [employeeRows]: any = await pool.query(
      `
      SELECT *
      FROM employees
      WHERE id = ?
        AND business_id = ?
      LIMIT 1
      `,
      [employeeId, currentUser.business_id]
    );

    if (employeeRows.length === 0) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      employee: employeeRows[0],
    });
  } catch (error) {
    console.error("Error fetching employee:", error);

    return NextResponse.json(
      { error: "Failed to fetch employee" },
      { status: 500 }
    );
  }
}

// PUT: Update an employee belonging to the current business
export async function PUT(
  req: NextRequest,
  { params }: RouteContext
) {
  const auth = await requireApiAuth();

  if (auth.response) {
    return auth.response;
  }

  const currentUser = auth.user;

  if (!canManageEmployees(currentUser.business_role)) {
    return NextResponse.json(
      {
        success: false,
        error: "You are not authorized to update employees.",
      },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const employeeId = Number(id);

    if (!Number.isInteger(employeeId) || employeeId <= 0) {
      return NextResponse.json(
        { error: "Invalid employee ID" },
        { status: 400 }
      );
    }

    const body = await req.json();

    // Verify that the employee belongs to the current business.
    const [oldRows]: any = await pool.query(
      `
      SELECT *
      FROM employees
      WHERE id = ?
        AND business_id = ?
      LIMIT 1
      `,
      [employeeId, currentUser.business_id]
    );

    if (oldRows.length === 0) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    const oldEmployee = oldRows[0];

    await pool.query(
      `
      UPDATE employees
      SET
        first_name = ?,
        last_name = ?,
        email = ?,
        phone = ?,
        address = ?,
        role = ?,
        status = ?
      WHERE id = ?
        AND business_id = ?
      `,
      [
        body.first_name,
        body.last_name,
        body.email,
        body.phone,
        body.address,
        body.role,
        body.status,
        employeeId,
        currentUser.business_id,
      ]
    );

    await logAudit({
      userId: currentUser.id,
      action: "UPDATE",
      entityName: "employees",
      recordId: employeeId,
      oldValues: oldEmployee,
      newValues: body,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating employee:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update employee",
      },
      { status: 500 }
    );
  }
}

// DELETE: Delete an employee belonging to the current business
export async function DELETE(
  req: NextRequest,
  { params }: RouteContext
) {
  const auth = await requireApiAuth();

  if (auth.response) {
    return auth.response;
  }

  const currentUser = auth.user;

  if (!canManageEmployees(currentUser.business_role)) {
    return NextResponse.json(
      {
        success: false,
        error: "You are not authorized to delete employees.",
      },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const employeeId = Number(id);

    if (!Number.isInteger(employeeId) || employeeId <= 0) {
      return NextResponse.json(
        { error: "Invalid employee ID" },
        { status: 400 }
      );
    }

    const [employeeRows]: any = await pool.query(
      `
      SELECT *
      FROM employees
      WHERE id = ?
        AND business_id = ?
      LIMIT 1
      `,
      [employeeId, currentUser.business_id]
    );

    if (employeeRows.length === 0) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    const oldEmployee = employeeRows[0];

    await pool.query(
      `
      DELETE FROM employees
      WHERE id = ?
        AND business_id = ?
      `,
      [employeeId, currentUser.business_id]
    );

    await logAudit({
      userId: currentUser.id,
      action: "DELETE",
      entityName: "employees",
      recordId: employeeId,
      oldValues: oldEmployee,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting employee:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete employee",
      },
      { status: 500 }
    );
  }
}