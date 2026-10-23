import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireApiAuth } from "@/lib/auth";

export async function GET() {
  try {
    const auth = await requireApiAuth();

    if (!auth.user) {
      return auth.response!;
    }

    const currentUser = auth.user;

    const [rows] = await pool.query(
      `
      SELECT
        p.id,
        p.name,
        p.payee_type,
        p.supplier_id,
        p.employee_id,
        p.company_name,
        p.address,
        p.phone,
        p.email,
        p.created_at,
        p.updated_at
      FROM payees p
      WHERE p.business_id = ?
      ORDER BY p.name ASC
      `,
      [currentUser.business_id]
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching payees:", error);

    return NextResponse.json(
      { error: "Failed to fetch payees" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireApiAuth();

  if (!auth.user) {
    return auth.response!;
  }

  const currentUser = auth.user;

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

    const [result] = await connection.query(
      `
      INSERT INTO payees (
        business_id,
        name,
        payee_type,
        supplier_id,
        employee_id,
        company_name,
        address,
        phone,
        email
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        currentUser.business_id,
        name.trim(),
        payee_type,
        payee_type === "SUPPLIER" ? supplier_id : null,
        payee_type === "EMPLOYEE" ? employee_id : null,
        company_name || null,
        address || null,
        phone || null,
        email || null,
      ]
    );

    await connection.commit();
    transactionStarted = false;

    return NextResponse.json(
      {
        success: true,
        payee_id: (result as any).insertId,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (transactionStarted) {
      await connection.rollback();
    }

    console.error("Error creating payee:", error);

    return NextResponse.json(
      { error: error.message || "Failed to create payee" },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}