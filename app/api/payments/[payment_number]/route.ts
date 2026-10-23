import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireApiAuth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ payment_number: string }> }
) {
  try {
    const auth = await requireApiAuth();

    if (!auth.user) {
      return auth.response!;
    }

    const currentUser = auth.user;
    const { payment_number } = await params;

    const [paymentRows]: any = await pool.query(
      `
      SELECT
        p.id,
        p.payment_number,
        p.customer_id,
        c.name AS customer_name,
        p.payment_date,
        p.payment_method,
        p.total_amount,
        p.reference,
        p.memo,
        p.created_at
      FROM payments p
      INNER JOIN customers c
        ON c.id = p.customer_id
       AND c.business_id = p.business_id
      WHERE p.payment_number = ?
        AND p.business_id = ?
      `,
      [payment_number, currentUser.business_id]
    );

    if (paymentRows.length === 0) {
      return NextResponse.json(
        { error: "Payment not found." },
        { status: 404 }
      );
    }

    const payment = paymentRows[0];

    const [allocationRows]: any = await pool.query(
      `
      SELECT
        pa.id,
        pa.invoice_id,
        pa.amount,
        i.invoice_number,
        i.invoice_date,
        i.total AS invoice_total
      FROM payment_allocations pa
      INNER JOIN invoices i
        ON i.id = pa.invoice_id
       AND i.business_id = ?
      WHERE pa.payment_id = ?
      ORDER BY i.invoice_date ASC, i.id ASC
      `,
      [currentUser.business_id, payment.id]
    );

    return NextResponse.json({
      payment,
      allocations: allocationRows,
    });
  } catch (error) {
    console.error("Payment detail error:", error);

    return NextResponse.json(
      { error: "Failed to fetch payment." },
      { status: 500 }
    );
  }
}
