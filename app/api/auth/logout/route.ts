import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import pool from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const response = NextResponse.json({
    success: true,
  });

  // Always clear the browser cookie, even if revocation fails.
  response.cookies.set("auth_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });

  try {
    const token = req.cookies.get("auth_token")?.value;
    const jwtSecret = process.env.JWT_SECRET;

    if (!token || !jwtSecret) {
      return response;
    }

    let decoded: jwt.JwtPayload;

    try {
      const verified = jwt.verify(token, jwtSecret);

      if (typeof verified === "string") {
        return response;
      }

      decoded = verified;
    } catch {
      // Invalid or expired tokens still get their browser cookie cleared.
      return response;
    }

    if (
      typeof decoded.sessionId !== "string" ||
      !decoded.sessionId
    ) {
      return response;
    }

    // Revoke only the session represented by this token.
    const [result]: any = await pool.query(
      `
      UPDATE user_sessions
      SET revoked_at = UTC_TIMESTAMP()
      WHERE id = ?
        AND user_id = ?
        AND revoked_at IS NULL
      `,
      [decoded.sessionId, decoded.userId]
    );

    // Record the logout when a session was successfully revoked.
    if (result.affectedRows > 0) {
      try {
        await logAudit({
          userId: Number(decoded.userId),
          action: "LOGOUT",
          entityName: "users",
          recordId: Number(decoded.userId),
          description: "User logged out",
        });
      } catch (error) {
        console.error("Logout audit error:", error);
      }
    }
  } catch (error) {
    // The cookie is cleared, but a database failure may mean the
    // server-side session remains valid until it expires.
    console.error("Logout session revocation error:", error);
  }

  return response;
}
