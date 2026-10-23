import { NextResponse, NextRequest } from "next/server";
import pool from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    
    const [rows] = await pool.query(`
      SELECT *
      FROM expense_categories
      WHERE is_active = 1
      ORDER BY name ASC
    `
    );

    return NextResponse.json(rows);

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch expense categories",
      },
      {
        status: 500,
      }
    );
  }
}