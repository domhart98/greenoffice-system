import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";
import { checkRateLimit } from "@/lib/rate_limit";
import { createEmailVerification } from "@/lib/email_verification";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

export const runtime = "nodejs";

interface ExistingUserRow extends RowDataPacket {
  id: number;
}

export async function POST(req: NextRequest) {
  // Public registration must be explicitly enabled.
  if (process.env.ALLOW_PUBLIC_REGISTRATION !== "true") {
    return NextResponse.json(
      {
        success: false,
        error: "Registration is currently unavailable.",
      },
      { status: 403 }
    );
  }

  // Identify the client for rate limiting.
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

  // Apply signup rate limiting before processing credentials.
  try {
    const allowed = await checkRateLimit(clientIp, {
      endpoint: "signup",
      windowMinutes: 15,
      maxAttempts: 5,
    });

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many registration attempts. Please try again later.",
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
    console.error("Signup rate-limit error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          "Registration is temporarily unavailable. Please try again later.",
      },
      { status: 503 }
    );
  }

  let connection: Awaited<ReturnType<typeof pool.getConnection>> | undefined;
  let transactionStarted = false;
  let userId: number | undefined;
  let email = "";

  try {
    // Parse the request body.
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

    // Reject null, arrays, and non-object JSON values.
    if (
      typeof body !== "object" ||
      body === null ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request body.",
        },
        { status: 400 }
      );
    }

    const payload = body as Record<string, unknown>;

    const username =
      typeof payload.username === "string"
        ? payload.username.trim()
        : "";

    email =
      typeof payload.email === "string"
        ? payload.email.trim().toLowerCase()
        : "";

    const businessName =
      typeof payload.businessName === "string"
        ? payload.businessName.trim()
        : "";

    const businessType =
      typeof payload.businessType === "string"
        ? payload.businessType.trim()
        : "";

    const password =
      typeof payload.password === "string"
        ? payload.password
        : "";

    // Validate required fields.
    if (!username || !email || !businessName || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "Please complete all required fields.",
        },
        { status: 400 }
      );
    }

    // Validate username.
    if (!/^[a-zA-Z0-9_.-]{3,100}$/.test(username)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Username must be 3–100 characters and contain only letters, numbers, periods, underscores, or hyphens.",
        },
        { status: 400 }
      );
    }

    // Basic email validation.
    if (
      email.length > 255 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter a valid email address.",
        },
        { status: 400 }
      );
    }

    // Validate business details.
    if (
      businessName.length > 255 ||
      businessType.length > 255
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Business details exceed the allowed length.",
        },
        { status: 400 }
      );
    }

    // bcrypt only processes up to 72 password bytes.
    if (
      password.length < 8 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Password must be at least 8 characters and no more than 72 bytes.",
        },
        { status: 400 }
      );
    }

    // Hash the password.
    const passwordHash = await bcrypt.hash(password, 12);

    connection = await pool.getConnection();

    // Check for an existing username or email.
    const [existingUsers] = await connection.execute<ExistingUserRow[]>(
      `
      SELECT id
      FROM users
      WHERE username = ? OR email = ?
      LIMIT 1
      `,
      [username, email]
    );

    if (existingUsers.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "That username or email address is already registered.",
        },
        { status: 409 }
      );
    }

    // Create all related account records in one transaction.
    await connection.beginTransaction();
    transactionStarted = true;

    // 1. Create a standard platform user.
    // Never accept platform_role from the client.
    const [userResult] = await connection.execute<ResultSetHeader>(
      `
      INSERT INTO users (
        username,
        email,
        password_hash,
        platform_role,
        is_active
      )
      VALUES (?, ?, ?, 'USER', 1)
      `,
      [username, email, passwordHash]
    );

    userId = userResult.insertId;

    // 2. Create the business.
    const [businessResult] = await connection.execute<ResultSetHeader>(
      `
      INSERT INTO businesses (
        name,
        business_type,
        is_demo,
        is_active
      )
      VALUES (?, ?, 0, 1)
      `,
      [businessName, businessType || null]
    );

    const businessId = businessResult.insertId;

    // 3. Assign the registering user as business owner.
    // Never accept the business role from the client.
    await connection.execute(
      `
      INSERT INTO business_users (
        business_id,
        user_id,
        role
      )
      VALUES (?, ?, 'OWNER')
      `,
      [businessId, userId]
    );

    // Do not create a session or issue an authentication cookie here.
    await connection.commit();
    transactionStarted = false;
  } catch (error: unknown) {
    // Roll back incomplete account creation.
    if (connection && transactionStarted) {
      try {
        await connection.rollback();
        transactionStarted = false;
      } catch (rollbackError) {
        console.error("Signup rollback error:", rollbackError);
      }
    }

    // Handle concurrent duplicate registrations.
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ER_DUP_ENTRY"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "That username or email address is already registered.",
        },
        { status: 409 }
      );
    }

    console.error("Signup error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to create your account. Please try again.",
      },
      { status: 500 }
    );
  } finally {
    connection?.release();
  }

  // The account now exists, but remains unverified and unauthenticated.
  // Send email after committing so an external email request does not
  // hold a database transaction open.
  try {
    if (!userId) {
      throw new Error("User ID was not available after account creation.");
    }

    await createEmailVerification(userId, email);

    return NextResponse.json(
      {
        success: true,
        message:
          "Your account has been created. Check your email for a verification link before signing in.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup verification email error:", error);

    // Do not disclose the raw error or create an authenticated session.
    // A resend-verification endpoint will allow the user to request another email.
    return NextResponse.json(
      {
        success: true,
        emailVerificationPending: true,
        message:
          "Your account has been created, but we couldn't send the verification email. Please try requesting another verification email.",
      },
      { status: 201 }
    );
  }
}