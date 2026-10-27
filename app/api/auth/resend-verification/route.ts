import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { checkRateLimit } from "@/lib/rate_limit";
import { createEmailVerification } from "@/lib/email_verification";
import type { RowDataPacket } from "mysql2";

export const runtime = "nodejs";

interface UserVerificationRow extends RowDataPacket {
  id: number;
  email_verified_at: Date | null;
}

const GENERIC_RESPONSE = {
  success: true,
  message:
    "If an account with that email address needs verification, a verification email will be sent.",
};

function genericResponse() {
  return NextResponse.json(GENERIC_RESPONSE, { status: 200 });
}

export async function POST(request: NextRequest) {
  // Identify the client for rate limiting.
  const clientIp =
    request.headers.get("cf-connecting-ip")?.trim() ||
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

  // Limit resend requests independently from signup and login.
  try {
    const allowed = await checkRateLimit(clientIp, {
      endpoint: "resend-verification",
      windowMinutes: 15,
      maxAttempts: 3,
    });

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many requests. Please try again later.",
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
    console.error("Resend verification rate-limit error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "The service is temporarily unavailable. Please try again later.",
      },
      { status: 503 }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid request.",
      },
      { status: 400 }
    );
  }

  if (
    typeof body !== "object" ||
    body === null ||
    Array.isArray(body) ||
    !("email" in body) ||
    typeof body.email !== "string"
  ) {
    return NextResponse.json(
      {
        success: false,
        error: "Please enter a valid email address.",
      },
      { status: 400 }
    );
  }

  const email = body.email.trim().toLowerCase();

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

  try {
    const [rows] = await pool.execute<UserVerificationRow[]>(
      `
      SELECT id, email_verified_at
      FROM users
      WHERE email = ?
        AND is_active = 1
      LIMIT 1
      `,
      [email]
    );

    const user = rows[0];

    // Use the same response whether the account is missing,
    // inactive, already verified, or eligible for verification.
    if (!user || user.email_verified_at !== null) {
      return genericResponse();
    }

    await createEmailVerification(user.id, email);

    return genericResponse();
  } catch (error) {
    console.error("Resend verification error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to process your request. Please try again later.",
      },
      { status: 500 }
    );
  }
}