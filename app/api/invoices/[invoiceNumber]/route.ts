import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [invoiceRows] = await pool.query(
      `
      SELECT *
      FROM invoices
      WHERE id = ?
      `,
      [id]
    );

    const [itemRows] = await pool.query(
      `
      SELECT *
      FROM invoice_items
      WHERE invoice_id = ?
      `,
      [id]
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