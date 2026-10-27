import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import pool from "@/lib/db";
import { checkRateLimit } from "@/lib/rate_limit";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  const clientIp =
    request.headers.get("cf-connecting-ip")?.trim() ||
    (process.env.NODE_ENV !== "production" ? "127.0.0.1" : "");

  if (!clientIp) {
    return NextResponse.json(
      { success: false, error: "Unable to process your request." },
      { status: 400 }
    );
  }

  try {
    const allowed = await checkRateLimit(clientIp, {
      endpoint: "reset-password",
      windowMinutes: 15,
      maxAttempts: 10,
    });

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many attempts. Please try again later.",
        },
        {
          status: 429,
          headers: { "Retry-After": "900" },
        }
      );
    }

    const body = await request.json().catch(() => null);

    if (
      !body ||
      typeof body.token !== "string" ||
      typeof body.password !== "string"
    ) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid token and password." },
        { status: 400 }
      );
    }

    const { token, password } = body;

    if (!/^[a-fA-F0-9]{64}$/.test(token)) {
      return NextResponse.json(
        {
          success: false,
          error: "This reset link is invalid or has expired. Please request a new one.",
        },
        { status: 400 }
      );
    }

    if (
      password.length < 8 ||
      new TextEncoder().encode(password).length > 72
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Your password must contain at least 8 characters and must not exceed 72 bytes.",
        },
        { status: 400 }
      );
    }

    const tokenHash = createHash("sha256").update(token).digest("hex");
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [tokenRows] = await connection.execute<RowDataPacket[]>(
        `SELECT id, user_id
         FROM password_reset_tokens
         WHERE token_hash = ?
           AND expires_at > UTC_TIMESTAMP()
           AND used_at IS NULL
         LIMIT 1
         FOR UPDATE`,
        [tokenHash]
      );

      if (tokenRows.length === 0) {
        await connection.rollback();

        return NextResponse.json(
          {
            success: false,
            error: "This reset link is invalid or has expired. Please request a new one.",
          },
          { status: 400 }
        );
      }

      const resetToken = tokenRows[0];
      const passwordHash = await bcrypt.hash(password, 12);

      const [userResult] = await connection.execute<ResultSetHeader>(
        `UPDATE users
         SET password_hash = ?
         WHERE id = ? AND is_active = 1`,
        [passwordHash, resetToken.user_id]
      );

      if (userResult.affectedRows !== 1) {
        await connection.rollback();

        return NextResponse.json(
          {
            success: false,
            error: "Unable to reset this password. Please request a new link.",
          },
          { status: 400 }
        );
      }

      await connection.execute(
        `UPDATE password_reset_tokens
         SET used_at = UTC_TIMESTAMP()
         WHERE user_id = ?
           AND used_at IS NULL`,
        [resetToken.user_id]
      );

      await connection.execute(
        `UPDATE user_sessions
         SET revoked_at = UTC_TIMESTAMP()
         WHERE user_id = ?
           AND revoked_at IS NULL`,
        [resetToken.user_id]
      );

      await connection.commit();

      return NextResponse.json({
        success: true,
        message: "Your password has been reset successfully. Please sign in.",
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Password reset failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to process your request. Please try again later.",
      },
      { status: 500 }
    );
  }
}