import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireApiAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await requireApiAuth();

  if (auth.response) {
    return auth.response;
  }

  const currentUser = auth.user;

  if (!currentUser) {
    return;
  }

  try {
    const search =
      req.nextUrl.searchParams.get("search")?.trim() || "";

    let query = `
      SELECT DISTINCT
        u.id,
        u.username,
        u.role,
        u.created_at,
        u.email
      FROM users u
      INNER JOIN business_users bu
        ON bu.user_id = u.id
      WHERE bu.business_id = ?
    `;

    const values: (string | number)[] = [
      currentUser.business_id,
    ];

    if (search) {
      query += `
        AND (
          CAST(u.id AS CHAR) LIKE ?
          OR u.username LIKE ?
        )
      `;

      values.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY u.id ASC`;

    const [rows] = await pool.query(query, values);

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching business users:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch users",
      },
      { status: 500 }
    );
  }
}
