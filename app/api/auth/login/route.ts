import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { logAudit } from "@/lib/audit";
import { checkRateLimit } from "@/lib/rate_limit";

export async function POST(req: NextRequest) {
  try {
    // Ensure the signing secret is configured.
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error("JWT_SECRET is not configured.");

      return NextResponse.json(
        {
          success: false,
          error: "Login is temporarily unavailable.",
        },
        { status: 500 }
      );
    }

    // Identify the client for application-level rate limiting.
    const clientIp =
      req.headers.get("cf-connecting-ip")?.trim() ||
      (process.env.NODE_ENV !== "production" ? "127.0.0.1" : "");

    if (!clientIp) {
      return NextResponse.json(
        {
          success: false,
          error: "Unable to process your request.",
        },
        { status: 400 }
      );
    }

    // Apply rate limiting before parsing credentials.
    try {
      const allowed = await checkRateLimit(clientIp, {
        endpoint: "login",
        windowMinutes: 15,
        maxAttempts: 5,
      });

      if (!allowed) {
        return NextResponse.json(
          {
            success: false,
            error: "Too many login attempts. Please try again later.",
          },
          {
            status: 429,
            headers: {
              "Retry-After": "900",
            },
          }
        );
      }
    } catch (error) {
      console.error("Login rate-limit error:", error);

      return NextResponse.json(
        {
          success: false,
          error: "Login is temporarily unavailable. Please try again later.",
        },
        { status: 503 }
      );
    }

    // Parse and validate the request body.
    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request body.",
        },
        { status: 400 }
      );
    }

    if (
      typeof body !== "object" ||
      body === null ||
      !("username" in body) ||
      !("password" in body) ||
      typeof body.username !== "string" ||
      typeof body.password !== "string" ||
      !body.username.trim() ||
      !body.password ||
      body.password.length > 1024
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Username and password are required.",
        },
        { status: 400 }
      );
    }

    const { username, password } = body;

    // Only allow active users to authenticate.
    const [rows]: any = await pool.query(
      `
      SELECT *
      FROM users
      WHERE username = ?
        AND is_active = 1
      LIMIT 1
      `,
      [username.trim()]
    );

    // Use the same message for unknown users and incorrect passwords.
    if (rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid username or password",
        },
        { status: 401 }
      );
    }

    const user = rows[0];

    const validPassword = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!validPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid username or password",
        },
        { status: 401 }
      );
    }

    // Require email verification before granting access.
    if (!user.email_verified_at) {
      return NextResponse.json(
        {
          success: false,
          error: "Please verify your email address before signing in.",
          code: "EMAIL_NOT_VERIFIED",
        },
        { status: 403 }
      );
    }

    // Ensure the user has an active business membership.
    const [membershipRows]: any = await pool.query(
      `
      SELECT bu.business_id
      FROM business_users bu
      JOIN businesses b ON b.id = bu.business_id
      WHERE bu.user_id = ?
        AND b.is_active = 1
      LIMIT 1
      `,
      [user.id]
    );

    if (membershipRows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Your account does not have access to an active business.",
        },
        { status: 403 }
      );
    }

    // Record the successful login.
    await pool.query(
      `
      UPDATE users
      SET last_login_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [user.id]
    );

    // Create a unique session for this login/device.
    const sessionId = randomUUID();

    // Create a JWT that expires after seven days.
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        platform_role: user.platform_role,
        sessionId,
      },
      jwtSecret,
      {
        expiresIn: "7d",
      }
    );

    // Store the session server-side, using UTC consistently.
    await pool.query(
      `
      INSERT INTO user_sessions (id, user_id, expires_at)
      VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 7 DAY))
      `,
      [sessionId, user.id]
    );

    await logAudit({
      userId: user.id,
      action: "LOGIN",
      entityName: "users",
      recordId: user.id,
      description: "User logged in",
    });

    const response = NextResponse.json({
      success: true,
    });

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Login failed",
      },
      { status: 500 }
    );
  }
}
