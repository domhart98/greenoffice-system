import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const [rows] = await pool.query(
      `
      SELECT MAX(invoice_number) AS maxNumber
      FROM invoices
      `
    );

    const result = rows as any[];

    const nextNumber =
      result[0]?.maxNumber
        ? result[0].maxNumber + 1
        : 100001;

    return NextResponse.json({
      invoiceNumber: nextNumber,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to get invoice number" },
      { status: 500 }
    );
  }
}