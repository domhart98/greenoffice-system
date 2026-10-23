import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireApiAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await requireApiAuth();

  if (auth.response) {
    return auth.response;
  }

  const currentUser = auth.user;

  try {
    const search =
      req.nextUrl.searchParams.get("search")?.trim() || "";

    let query = `
      SELECT *
      FROM suppliers
      WHERE business_id = ?
    `;

    const values: (string | number)[] = [
      currentUser.business_id,
    ];

    if (search) {
      query += `
        AND (
          CAST(id AS CHAR) LIKE ?
          OR name LIKE ?
        )
      `;

      values.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY id ASC`;

    const [rows] = await pool.query(query, values);

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching suppliers:", error);

    return NextResponse.json(
      { error: "Failed to fetch suppliers" },
      { status: 500 }
    );
  }
}


