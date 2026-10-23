import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import pool from "@/lib/db";
import { requireApiAuth } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ invoiceNumber: string }>;
};

type InvoiceRow = RowDataPacket & {
  id: number;
  invoice_number: number;
  business_id: number;
  status: string;
  open_balance: number | string | null;
};

function canManageInvoices(role: string): boolean {
  return role === "OWNER" || role === "ADMIN";
}

export async function PATCH(
  req: NextRequest,
  { params }: RouteContext
) {
  const auth = await requireApiAuth();

  if (auth.response) {
    return auth.response;
  }

  const currentUser = auth.user;

  if (!canManageInvoices(currentUser.business_role)) {
    return NextResponse.json(
      { error: "You do not have permission to change invoice status." },
      { status: 403 }
    );
  }

  const { invoiceNumber: invoiceNumberParam } = await params;
  const invoiceNumber = Number(invoiceNumberParam);

  if (
    !invoiceNumberParam ||
    !Number.isSafeInteger(invoiceNumber) ||
    invoiceNumber <= 0
  ) {
    return NextResponse.json(
      { error: "Invalid invoice number." },
      { status: 400 }
    );
  }

  let body: { status?: unknown };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body." },
      { status: 400 }
    );
  }

  if (typeof body.status !== "string") {
    return NextResponse.json(
      { error: "A valid status is required." },
      { status: 400 }
    );
  }

  // Status changes with financial or inventory consequences must use
  // their dedicated API workflows.
  if (body.status !== "VOID") {
    return NextResponse.json(
      {
        error:
          "This endpoint only supports voiding draft invoices. " +
          "Use the issue API to issue a draft invoice, the void API " +
          "to void an issued invoice, and the payment workflow to " +
          "mark an invoice as paid.",
      },
      { status: 400 }
    );
  }

  const connection = await pool.getConnection();
  let transactionStarted = false;

  try {
    await connection.beginTransaction();
    transactionStarted = true;

    // Lock only an invoice belonging to the authenticated business.
    const [invoiceRows] = await connection.query<InvoiceRow[]>(
      `
      SELECT
        id,
        invoice_number,
        business_id,
        status,
        open_balance
      FROM invoices
      WHERE invoice_number = ?
        AND business_id = ?
      FOR UPDATE
      `,
      [invoiceNumber, currentUser.business_id]
    );

    if (invoiceRows.length === 0) {
      await connection.rollback();
      transactionStarted = false;

      return NextResponse.json(
        { error: "Invoice not found." },
        { status: 404 }
      );
    }

    const invoice = invoiceRows[0];

    // Only draft invoices can be voided through this endpoint.
    // Issued invoices must use the dedicated void API so inventory
    // can be restored and stock movements recorded.
    if (invoice.status !== "DRAFT") {
      await connection.rollback();
      transactionStarted = false;

      return NextResponse.json(
        {
          error:
            `Cannot void this invoice through the status API ` +
            `because its current status is ${invoice.status}. ` +
            "Use the dedicated void API for issued invoices.",
        },
        { status: 400 }
      );
    }

    const [updateResult] = await connection.query<ResultSetHeader>(
      `
      UPDATE invoices
      SET status = 'VOID',
          open_balance = 0
      WHERE id = ?
        AND business_id = ?
        AND status = 'DRAFT'
      `,
      [invoice.id, currentUser.business_id]
    );

    if (updateResult.affectedRows !== 1) {
      throw new Error("Invoice status changed unexpectedly.");
    }

    // Assumes audit_logs.business_id exists.
    await connection.query(
      `
      INSERT INTO audit_logs (
        business_id,
        action,
        entity_name,
        record_id,
        description,
        old_values,
        new_values
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        currentUser.business_id,
        "UPDATE",
        "invoices",
        invoice.id,
        `Draft invoice ${invoice.invoice_number} voided.`,
        JSON.stringify({
          status: invoice.status,
          open_balance: invoice.open_balance,
        }),
        JSON.stringify({
          status: "VOID",
          open_balance: 0,
        }),
      ]
    );

    await connection.commit();
    transactionStarted = false;

    return NextResponse.json({
      success: true,
      invoice_number: invoice.invoice_number,
      status: "VOID",
      message: `Draft invoice ${invoice.invoice_number} has been voided.`,
    });
  } catch (error: unknown) {
    if (transactionStarted) {
      await connection.rollback();
    }

    console.error("Invoice status update error:", error);

    return NextResponse.json(
      { error: "Failed to update invoice status." },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}