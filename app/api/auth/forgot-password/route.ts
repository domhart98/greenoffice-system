import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import pool from "@/lib/db";
import { checkRateLimit } from "@/lib/rate_limit";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const RESET_TOKEN_EXPIRY_MINUTES = 30;

const GENERIC_MESSAGE =
  "If an account exists for that email address, a password reset link will be sent.";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    // Identify the requester.
    const clientIp =
      request.headers.get("cf-connecting-ip")?.trim() ||
      (process.env.NODE_ENV !== "production" ? "127.0.0.1" : "");

    if (!clientIp) {
      return NextResponse.json(
        { success: false, error: "Unable to process your request." },
        { status: 400 }
      );
    }

    // Limit password reset requests by IP.
    const allowed = await checkRateLimit(clientIp, {
      endpoint: "forgot-password",
      windowMinutes: 15,
      maxAttempts: 5,
    });

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many requests. Please try again later.",
        },
        {
          status: 429,
          headers: { "Retry-After": "900" },
        }
      );
    }

    const body = await request.json().catch(() => null);

    if (!body || typeof body.email !== "string") {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const email = body.email.trim().toLowerCase();

    if (
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // Use the same generic response regardless of whether the account exists.
    const [users] = await pool.execute(
      `SELECT id, email
       FROM users
       WHERE email = ?
         AND is_active = 1
       LIMIT 1`,
      [email]
    );

    const userRows = users as Array<{ id: number; email: string }>;

    if (userRows.length > 0) {
      const user = userRows[0];

      // Generate a cryptographically secure token; only its hash is stored.
      const token = randomBytes(32).toString("hex");
      const tokenHash = hashToken(token);

      const baseUrl = process.env.APP_URL;
      const from = process.env.RESEND_FROM;

      if (!baseUrl || !from || !process.env.RESEND_API_KEY) {
        throw new Error("Password reset email configuration is incomplete.");
      }

      const resetUrl = new URL("/reset-password", baseUrl);
      resetUrl.searchParams.set("token", token);

      // Store the new token before sending the email.
      await pool.execute(
        `INSERT INTO password_reset_tokens
          (user_id, token_hash, expires_at)
         VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? MINUTE))`,
        [user.id, tokenHash, RESET_TOKEN_EXPIRY_MINUTES]
      );

      const { error } = await resend.emails.send({
        from,
        to: user.email,
        subject: "Reset your Green Office password",
        text: [
          "We received a request to reset your Green Office password.",
          "",
          `Use this link to choose a new password: ${resetUrl.toString()}`,
          "",
          "This link expires in 30 minutes and can only be used once.",
          "If you did not request a password reset, you can ignore this email.",
        ].join("\n"),
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #334155;">
            <h2 style="color: #047857;">Reset your password</h2>
            <p>We received a request to reset your Green Office password.</p>
            <p>
              <a href="${resetUrl.toString()}"
                 style="display:inline-block;padding:12px 20px;background:#059669;color:#ffffff;text-decoration:none;border-radius:6px;">
                Reset Password
              </a>
            </p>
            <p>This link expires in 30 minutes and can only be used once.</p>
            <p>If you did not request a password reset, you can safely ignore this email.</p>
          </div>
        `,
      });

      if (error) {
        console.error("Password reset email could not be sent:", error);
        // Keep the public response generic.
        // The stored token expires naturally if the email was not delivered.
      }
    }

    return NextResponse.json({
      success: true,
      message: GENERIC_MESSAGE,
    });
  } catch (error) {
    console.error("Forgot password request failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to process your request. Please try again later.",
      },
      { status: 500 }
    );
  }
}