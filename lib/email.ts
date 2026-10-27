import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM;

export async function sendVerificationEmail(
  email: string,
  verificationUrl: string
): Promise<void> {
  if (!process.env.RESEND_API_KEY || !FROM_EMAIL) {
    throw new Error("Email service environment variables are missing.");
  }

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [email],
    subject: "Verify your Green Office account",
    text: [
      "Welcome to Green Office!",
      "",
      "Please verify your email address by opening this link:",
      verificationUrl,
      "",
      "This link expires in 24 hours.",
      "",
      "If you did not create this account, you can ignore this email.",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #222;">
        <h2>Welcome to Green Office</h2>
        <p>Please verify your email address to complete your account registration.</p>
        <p style="margin: 28px 0;">
          <a
            href="${verificationUrl}"
            style="background: #166534; color: #ffffff; padding: 12px 22px; text-decoration: none; border-radius: 6px; display: inline-block;"
          >
            Verify Email Address
          </a>
        </p>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all;">${verificationUrl}</p>
        <p>This link expires in 24 hours.</p>
        <p>If you did not create this account, you can ignore this email.</p>
      </div>
    `,
  });

  if (error) {
    console.error("Failed to send verification email:", error);
    throw new Error("Unable to send verification email.");
  }
}
