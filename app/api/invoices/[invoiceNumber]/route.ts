import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ invoiceNumber: string }> }
) {
  try {
    const { invoiceNumber } = await params;

    const [invoiceRows] = await pool.query(
      `
      SELECT *
      FROM invoices
      WHERE invoice_number = ?
      `,
      [invoiceNumber]
    );

    const invoice = (invoiceRows as any[])[0];

    if (!invoice) {
      return;
    }

    const [itemRows] = await pool.query(
      `
      SELECT *
      FROM invoice_items
      WHERE invoice_id = ?
      `,
      [invoice.id]
    );

    return NextResponse.json({
      invoice: (invoiceRows as any[])[0],
      items: itemRows,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to fetch invoice" },
      { status: 500 }
    );
  }
}