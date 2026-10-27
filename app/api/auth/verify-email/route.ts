import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import pool from "@/lib/db";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export const runtime = "nodejs";

interface VerificationTokenRow extends RowDataPacket {
  id: number;
  user_id: number;
  used_at: Date | null;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request." },
      { status: 400 }
    );
  }

  if (
    typeof body !== "object" ||
    body === null ||
    Array.isArray(body) ||
    !("token" in body) ||
    typeof body.token !== "string" ||
    !/^[a-fA-F0-9]{64}$/.test(body.token)
  ) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid or expired verification link.",
      },
      { status: 400 }
    );
  }

  const connection = await pool.getConnection();
  let transactionStarted = false;

  try {
    await connection.beginTransaction();
    transactionStarted = true;

    const tokenHash = hashToken(body.token);

    const [rows] = await connection.execute<VerificationTokenRow[]>(
      `
      SELECT id, user_id, used_at
      FROM email_verification_tokens
      WHERE token_hash = ?
        AND expires_at > UTC_TIMESTAMP()
        AND used_at IS NULL
      LIMIT 1
      FOR UPDATE
      `,
      [tokenHash]
    );

    const verification = rows[0];

    if (!verification) {
      await connection.rollback();
      transactionStarted = false;

      return NextResponse.json(
        {
          success: false,
          error:
            "This verification link is invalid, expired, or has already been used.",
        },
        { status: 400 }
      );
    }

    await connection.execute<ResultSetHeader>(
      `
      UPDATE users
      SET email_verified_at = COALESCE(
        email_verified_at,
        UTC_TIMESTAMP()
      )
      WHERE id = ?
      `,
      [verification.user_id]
    );

    await connection.execute<ResultSetHeader>(
      `
      UPDATE email_verification_tokens
      SET used_at = UTC_TIMESTAMP()
      WHERE id = ?
        AND used_at IS NULL
      `,
      [verification.id]
    );

    await connection.commit();
    transactionStarted = false;

    return NextResponse.json({
      success: true,
      message: "Email verified successfully. You can now sign in.",
    });
  } catch (error) {
    if (transactionStarted) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Verification rollback error:", rollbackError);
      }
    }

    console.error("Email verification failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to verify your email at this time.",
      },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}