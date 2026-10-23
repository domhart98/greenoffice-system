
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import pool from "./db";

export type CurrentUser = {
  id: number;
  username: string;
  role: string;
  business_id: number;
  business_role: string;
  business_name: string;
  is_demo: number;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = (await cookies()).get("auth_token");

  if (!token) return null;

  let decoded: jwt.JwtPayload;

  // Invalid or expired tokens should be treated as unauthenticated.
  try {
    const verified = jwt.verify(
      token.value,
      process.env.JWT_SECRET!
    );

    if (typeof verified === "string") return null;

    decoded = verified;
  } catch {
    return null;
  }

  if (!Number.isInteger(decoded.userId)) {
    return null;
  }

  // Database errors should propagate rather than masquerade as
  // invalid authentication.
  const [rows]: any = await pool.query(
    `
    SELECT
      u.id,
      u.username,
      u.role,
      bu.business_id,
      bu.role AS business_role,
      b.name AS business_name,
      b.is_demo
    FROM users u
    JOIN business_users bu ON bu.user_id = u.id
    JOIN businesses b ON b.id = bu.business_id
    WHERE u.id = ?
      AND u.is_active = 1
      AND b.is_active = 1
    LIMIT 1
    `,
    [decoded.userId]
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

export async function signup(formData: FormData) {
  // Registration will be implemented later.
}
