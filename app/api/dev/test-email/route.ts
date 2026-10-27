import { NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

export async function POST() {
  // This endpoint must never be available in production.
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Not found." },
      { status: 404 }
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  const to = process.env.EMAIL_TEST_TO;

  if (!apiKey || !from || !to) {
    return NextResponse.json(
      { error: "Email test environment variables are missing." },
      { status: 500 }
    );
  }

  try {
    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
      from,
      to: [to],
      subject: "Green Office System - Email Test",
      html: `
        <h2>Green Office System</h2>
        <p>This is a test email from Green Office System.</p>
        <p>If you received this message, Resend email delivery is working.</p>
      `,
      text:
        "Green Office System - Email Test\n\n" +
        "This is a test email from Green Office System.\n" +
        "If you received this message, Resend email delivery is working.",
    });

    if (error) {
      console.error("Resend test email failed:", error);

      return NextResponse.json(
        { error: "Resend could not send the test email." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Test email accepted by Resend.",
      id: data?.id,
    });
  } catch (error) {
    console.error("Email test endpoint failed:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred while sending the test email." },
      { status: 500 }
    );
  }
}