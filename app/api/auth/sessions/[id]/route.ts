import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireApiAuth } from "@/lib/auth";

type RouteContext = {
  params: Promise<{
    sessionId: string;
  }>;
};

export async function DELETE(
  req: NextRequest,
  context: RouteContext
) {
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

    const { sessionId } = await context.params;

    // Validate the UUID format before querying the database.
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidPattern.test(sessionId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid session ID.",
        },
        { status: 400 }
      );
    }

    // Revoke only a session owned by the authenticated user.
    const [result]: any = await pool.query(
      `
      UPDATE user_sessions
      SET revoked_at = UTC_TIMESTAMP()
      WHERE id = ?
        AND user_id = ?
        AND revoked_at IS NULL
        AND expires_at > UTC_TIMESTAMP()
      `,
      [sessionId, user.id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Active session not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Session revoked successfully.",
    });
  } catch (error) {
    console.error("Revoke session error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to revoke session.",
      },
      { status: 500 }
    );
  }
}
