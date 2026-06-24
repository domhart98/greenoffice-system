import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;

  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const sort = searchParams.get("sort") || "newest";

  let query = `
    SELECT *
    FROM invoices
    WHERE 1 = 1
  `;

  const values: any[] = [];

  if (search) {
    query += `
      AND (
        customer_name LIKE ?
        OR invoice_number LIKE ?
      )
    `;

    values.push(`%${search}%`);
    values.push(`%${search}%`);
  }

  if (status && status !== "ALL") {
    query += ` AND status = ?`;
    values.push(status);
  }

  if (sort === "newest") {
    query += " ORDER BY created_at DESC";
  }

  if (sort === "oldest") {
    query += " ORDER BY created_at ASC";
  }

  if (sort === "highest") {
    query += " ORDER BY total DESC";
  }

  if (sort === "lowest") {
    query += " ORDER BY total ASC";
  }

  const [rows] = await pool.query(query, values);

  return NextResponse.json(rows);
}