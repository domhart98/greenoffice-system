import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireApiAuth } from "@/lib/auth";

interface PaymentAllocation {
  invoice_id: number;
  amount: number;
}

interface PaymentRequest {
  customer_id: number;
  payment_date: string;
  payment_method: string;
  reference?: string;
  memo?: string;
  allocations: PaymentAllocation[];
}

export async function POST(request: NextRequest) {
  // Authenticate before opening a database connection.
  let auth;

  try {
    auth = await requireApiAuth();
  } catch (error) {
    console.error("Payment authentication error:", error);

    return NextResponse.json(
      { success: false, error: "Authentication failed." },
      { status: 500 }
    );
  }

  if (!auth.user) {
    return auth.response!;
  }

  const currentUser = auth.user;
  let connection;

  try {
    const body: PaymentRequest = await request.json();

    const {
      customer_id,
      payment_date,
      payment_method,
      reference,
      memo,
      allocations,
    } = body;

    // Basic validation
    if (
      !Number.isInteger(Number(customer_id)) ||
      Number(customer_id) < 1
    ) {
      return NextResponse.json(
        { error: "A valid customer is required." },
        { status: 400 }
      );
    }

    if (!payment_date) {
      return NextResponse.json(
        { error: "Payment date is required." },
        { status: 400 }
      );
    }

    if (!payment_method || !payment_method.trim()) {
      return NextResponse.json(
        { error: "Payment method is required." },
        { status: 400 }
      );
    }

    if (!Array.isArray(allocations) || allocations.length === 0) {
      return NextResponse.json(
        { error: "At least one invoice payment is required." },
        { status: 400 }
      );
    }

    const validAllocations = allocations.map((allocation) => ({
      invoice_id: Number(allocation.invoice_id),
      amount: Number(allocation.amount),
    }));

    if (
      validAllocations.some(
        (allocation) =>
          !Number.isInteger(allocation.invoice_id) ||
          allocation.invoice_id < 1 ||
          !Number.isFinite(allocation.amount) ||
          allocation.amount <= 0
      )
    ) {
      return NextResponse.json(
        { error: "Every allocation must have a valid invoice and positive amount." },
        { status: 400 }
      );
    }

    const totalAmount = validAllocations.reduce(
      (sum, allocation) => sum + allocation.amount,
      0
    );

    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      return NextResponse.json(
        { error: "Payment amount must be greater than zero." },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Verify the customer belongs to the current business.
    const [customerRows]: any = await connection.query(
      `
      SELECT id
      FROM customers
      WHERE id = ?
        AND business_id = ?
      FOR UPDATE
      `,
      [customer_id, currentUser.business_id]
    );

    if (customerRows.length === 0) {
      await connection.rollback();

      return NextResponse.json(
        { error: "Customer not found." },
        { status: 404 }
      );
    }

    // Generate the next payment number.
    const [lastPaymentRows]: any = await connection.query(
      `
      SELECT payment_number
      FROM payments
      ORDER BY id DESC
      LIMIT 1
      FOR UPDATE
      `
    );

    let paymentNumber = "PAY-000001";

    if (lastPaymentRows.length > 0) {
      const lastNumber = String(lastPaymentRows[0].payment_number);
      const match = lastNumber.match(/^PAY-(\d+)$/);

      if (match) {
        const nextNumber = Number(match[1]) + 1;
        paymentNumber = `PAY-${String(nextNumber).padStart(6, "0")}`;
      }
    }

    // Create the payment under the authenticated user's business.
    const [paymentResult]: any = await connection.query(
      `
      INSERT INTO payments (
        business_id,
        payment_number,
        customer_id,
        payment_date,
        payment_method,
        total_amount,
        reference,
        memo
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        currentUser.business_id,
        paymentNumber,
        customer_id,
        payment_date,
        payment_method,
        totalAmount.toFixed(2),
        reference || null,
        memo || null,
      ]
    );

    const paymentId = paymentResult.insertId;

    // Allocate the payment to invoices belonging to this business.
    for (const allocation of validAllocations) {
      const invoiceId = allocation.invoice_id;
      const amount = allocation.amount;

      const [invoiceRows]: any = await connection.query(
        `
        SELECT
          id,
          customer_id,
          total,
          open_balance,
          status
        FROM invoices
        WHERE id = ?
          AND business_id = ?
        FOR UPDATE
        `,
        [invoiceId, currentUser.business_id]
      );

      if (invoiceRows.length === 0) {
        await connection.rollback();

        return NextResponse.json(
          { error: `Invoice ${invoiceId} not found.` },
          { status: 404 }
        );
      }

      const invoice = invoiceRows[0];

      if (Number(invoice.customer_id) !== Number(customer_id)) {
        await connection.rollback();

        return NextResponse.json(
          {
            error: `Invoice ${invoiceId} does not belong to the selected customer.`,
          },
          { status: 400 }
        );
      }

      if (
        invoice.status !== "UNPAID" &&
        invoice.status !== "PARTIAL"
      ) {
        await connection.rollback();

        return NextResponse.json(
          { error: `Invoice ${invoiceId} cannot receive a payment.` },
          { status: 400 }
        );
      }

      const openBalance = Number(invoice.open_balance);
      const total = Number(invoice.total);

      if (
        !Number.isFinite(openBalance) ||
        !Number.isFinite(total) ||
        amount > openBalance
      ) {
        await connection.rollback();

        return NextResponse.json(
          {
            error: `Payment exceeds the outstanding balance for invoice ${invoiceId}.`,
          },
          { status: 400 }
        );
      }

      // Record the allocation.
      await connection.query(
        `
        INSERT INTO payment_allocations (
          payment_id,
          invoice_id,
          amount
        )
        VALUES (?, ?, ?)
        `,
        [paymentId, invoiceId, amount.toFixed(2)]
      );

      // Update the invoice balance and status.
      const newBalance = Math.max(
        0,
        Number((openBalance - amount).toFixed(2))
      );

      const newStatus =
        newBalance <= 0
          ? "PAID"
          : newBalance < total
            ? "PARTIAL"
            : "UNPAID";

      await connection.query(
        `
        UPDATE invoices
        SET
          open_balance = ?,
          status = ?
        WHERE id = ?
          AND business_id = ?
        `,
        [
          newBalance.toFixed(2),
          newStatus,
          invoiceId,
          currentUser.business_id,
        ]
      );
    }

    await connection.commit();

    return NextResponse.json(
      {
        success: true,
        payment_id: paymentId,
        payment_number: paymentNumber,
        total_amount: totalAmount,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Payment rollback error:", rollbackError);
      }
    }

    console.error("Payment creation error:", error);

    return NextResponse.json(
      { error: "Failed to create payment." },
      { status: 500 }
    );
  } finally {
    connection?.release();
  }
}

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
      WHERE p.business_id = ?
      ORDER BY p.payment_date DESC, p.id DESC
      `,
      [currentUser.business_id]
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Payments fetch error:", error);

    return NextResponse.json(
      { error: "Failed to fetch payments." },
      { status: 500 }
    );
  }
}