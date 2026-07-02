import { NextResponse, NextRequest } from "next/server";
import pool from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const [rows] = await pool.query(
        `
        SELECT *
        FROM stock_movements
        ORDER BY created_at DESC
        LIMIT 10
        `
    )

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