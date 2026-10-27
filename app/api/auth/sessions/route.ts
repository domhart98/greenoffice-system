import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireApiAuth } from "@/lib/auth";

export async function GET() {
  try {
    const { user, response } = await requireApiAuth();

    if (response) {
      return response;
    }

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
        },
        { status: 401 }
      );
    }

    const [rows]: any = await pool.query(
      `
      SELECT
        id,
        created_at,
        expires_at
      FROM user_sessions
      WHERE user_id = ?
        AND revoked_at IS NULL
        AND expires_at > UTC_TIMESTAMP()
      ORDER BY created_at DESC
      `,
      [user.id]
    );

    return NextResponse.json({
      success: true,
      sessions: rows,
    });
  } catch (error) {
    console.error("List sessions error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to retrieve sessions.",
      },
      { status: 500 }
    );
  }
}
