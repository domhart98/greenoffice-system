import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const search =
      req.nextUrl.searchParams.get("search") || "";

    let query = `
      SELECT
        id,
        invoice_number,
        customer_name,
        invoice_date,
        total
      FROM invoices
    `;

    const values: any[] = [];

    if (search.trim()) {
      query += `
        WHERE
          CAST(invoice_number AS CHAR) LIKE ?
          OR customer_name LIKE ?
      `;

      values.push(
        `%${search}%`,
        `%${search}%`
      );
    }

    query += `
      ORDER BY invoice_number DESC
    `;

    const [rows] = await pool.query(
      query,
      values
    );

    return NextResponse.json(rows);

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch invoices",
      },
      {
        status: 500,
      }
    );
  }
}