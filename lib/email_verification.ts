import { createHash, randomBytes } from "crypto";
import pool from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";

const TOKEN_EXPIRY_HOURS = 24;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createEmailVerification(
  userId: number,
  email: string
): Promise<void> {
  const baseUrl = process.env.APP_URL;

  if (!baseUrl) {
    throw new Error("APP_URL environment variable is missing.");
  }

  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);

  const verificationUrl = new URL("/verify-email", baseUrl);
  verificationUrl.searchParams.set("token", token);

  // Store only the token hash.
  const [result] = await pool.execute(
    `
    INSERT INTO email_verification_tokens
      (user_id, token_hash, expires_at)
    VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? HOUR))
    `,
    [userId, tokenHash, TOKEN_EXPIRY_HOURS]
  );

  try {
    // Send the email before invalidating previous links.
    await sendVerificationEmail(email, verificationUrl.toString());

    // Only after successful delivery, invalidate older unused tokens.
    await pool.execute(
      `
      UPDATE email_verification_tokens
      SET used_at = UTC_TIMESTAMP()
      WHERE user_id = ?
        AND token_hash <> ?
        AND used_at IS NULL
      `,
      [userId, tokenHash]
    );
  } catch (error) {
    // Leave previous links usable if sending the replacement fails.
    // The newly inserted token remains unused but will expire naturally.
    throw error;
  }
}