import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireApiAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiAuth();

    if (!auth.user) {
      return auth.response!;
    }

    const currentUser = auth.user;
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customer_id");

    if (!customerId || !/^\d+$/.test(customerId) || Number(customerId) < 1) {
      return NextResponse.json(
        { error: "A valid customer_id is required." },
        { status: 400 }
      );
    }

    // Verify the customer belongs to the authenticated user's business.
    const [customerRows]: any = await pool.query(
      `
      SELECT id
      FROM customers
      WHERE id = ?
        AND business_id = ?
      `,
      [Number(customerId), currentUser.business_id]
    );

    if (customerRows.length === 0) {
      return NextResponse.json(
        { error: "Customer not found." },
        { status: 404 }
      );
    }

    const [rows] = await pool.query(
      `
      SELECT
        id,
        invoice_number,
        invoice_date,
        due_date,
        terms,
        total,
        open_balance,
        status
      FROM invoices
      WHERE customer_id = ?
        AND business_id = ?
        AND open_balance > 0
      ORDER BY invoice_date ASC, id ASC
      `,
      [Number(customerId), currentUser.business_id]
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Outstanding invoices error:", error);

    return NextResponse.json(
      { error: "Failed to fetch outstanding invoices." },
      { status: 500 }
    );
  }
}