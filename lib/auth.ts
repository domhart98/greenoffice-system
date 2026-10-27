import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import pool from "./db";

export type CurrentUser = {
  id: number;
  username: string;
  platform_role: string;
  business_id: number;
  business_role: string;
  business_name: string;
  is_demo: number;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = (await cookies()).get("auth_token");

  if (!token) return null;

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not configured.");
  }

  let decoded: jwt.JwtPayload;

  // Invalid or expired tokens are treated as unauthenticated.
  try {
    const verified = jwt.verify(
      token.value,
      jwtSecret
    );

    if (typeof verified === "string") return null;

    decoded = verified;
  } catch {
    return null;
  }

  // Require a valid user ID and a session ID.
  if (
    !Number.isInteger(decoded.userId) ||
    typeof decoded.sessionId !== "string" ||
    !decoded.sessionId
  ) {
    return null;
  }

  // Verify the session and retrieve the user's active business membership.
  // Database errors propagate rather than masquerading as invalid authentication.
  const [rows]: any = await pool.query(
    `
    SELECT
      u.id,
      u.username,
      u.platform_role,
      u.is_active,
      u.email,
      bu.business_id,
      bu.role AS business_role,
      b.name AS business_name,
      b.is_demo
    FROM user_sessions s
    JOIN users u
      ON u.id = s.user_id
    JOIN business_users bu
      ON bu.user_id = u.id
    JOIN businesses b
      ON b.id = bu.business_id
    WHERE s.id = ?
      AND s.user_id = ?
      AND s.revoked_at IS NULL
      AND s.expires_at > UTC_TIMESTAMP()
      AND u.is_active = 1
      AND b.is_active = 1
    LIMIT 1
    `,
    [decoded.sessionId, decoded.userId]
  );

  return rows[0] ?? null;
}

// For protected pages: redirect to login.
export async function requireAuth(): Promise<CurrentUser> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  return currentUser;
}

// For API routes: return JSON 401 instead of redirecting.
export async function requireApiAuth(): Promise<{
  user: CurrentUser | null;
  response: NextResponse | null;
}> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    const response = NextResponse.json(
      {
        success: false,
        error: "Authentication required",
      },
      { status: 401 }
    );

    response.cookies.delete("auth_token");

    return { user: null, response };
  }

  return { user: currentUser, response: null };
}
