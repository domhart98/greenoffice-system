import { NextResponse, NextRequest } from "next/server";
import pool from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const search =
      req.nextUrl.searchParams.get("search") || "";

    let query = `
      SELECT *
      FROM products
    `;

    const values: any[] = [];

    if (search.trim()) {
      query += `
        WHERE
          CAST(id AS CHAR) LIKE ?
          OR name LIKE ?
      `;

      values.push(
        `%${search}%`,
        `%${search}%`
      );
    }

    query += `
      ORDER BY id ASC
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