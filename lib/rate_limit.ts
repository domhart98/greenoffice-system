import { createHash } from "crypto";
import pool from "@/lib/db";

type RateLimitOptions = {
  endpoint: "signup" | "login" | "resend-verification"| "forgot-password" | "reset-password";
  windowMinutes: number;
  maxAttempts: number;
};

export async function checkRateLimit(
  clientIp: string,
  options: RateLimitOptions
): Promise<boolean> {
  const { endpoint, windowMinutes, maxAttempts } = options;

  if (
    !clientIp ||
    !Number.isInteger(windowMinutes) ||
    windowMinutes < 1 ||
    !Number.isInteger(maxAttempts) ||
    maxAttempts < 1
  ) {
    throw new Error("Invalid rate-limit configuration.");
  }

  const bucketKey = createHash("sha256")
    .update(`${endpoint}:${clientIp}`)
    .digest("hex");

  const connection = await pool.getConnection();

  try {
    await connection.execute(
      `
      INSERT INTO rate_limit_buckets (
        bucket_key,
        window_start,
        attempts
      )
      VALUES (?, UTC_TIMESTAMP(), 1)
      ON DUPLICATE KEY UPDATE
        attempts = IF(
          window_start <= DATE_SUB(
            UTC_TIMESTAMP(),
            INTERVAL ${windowMinutes} MINUTE
          ),
          1,
          attempts + 1
        ),
        window_start = IF(
          window_start <= DATE_SUB(
            UTC_TIMESTAMP(),
            INTERVAL ${windowMinutes} MINUTE
          ),
          UTC_TIMESTAMP(),
          window_start
        )
      `,
      [bucketKey]
    );

    const [rows]: any = await connection.execute(
      `
      SELECT attempts
      FROM rate_limit_buckets
      WHERE bucket_key = ?
      `,
      [bucketKey]
    );

    if (!rows.length) {
      throw new Error("Rate-limit bucket could not be retrieved.");
    }

    return rows[0].attempts <= maxAttempts;
  } finally {
    connection.release();
  }
}