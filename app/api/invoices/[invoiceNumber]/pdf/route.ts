import puppeteer, { type Browser } from "puppeteer";
import { NextResponse, NextRequest } from "next/server";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { requireApiAuth } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ invoiceNumber: string }>;
};

type InvoiceRow = RowDataPacket & {
  id: number;
  invoice_number: number;
  business_id: number;
};

export async function GET(
  req: NextRequest,
  { params }: RouteContext
) {
  // 1. Authenticate the API request.
  const auth = await requireApiAuth();

  if (auth.response) {
    return auth.response;
  }

  const currentUser = auth.user;

  // Puppeteer needs the authentication cookie to access the invoice page.
  const authCookie = req.cookies.get("auth_token");

  if (!authCookie?.value) {
    return NextResponse.json(
      { error: "Authentication cookie is missing." },
      { status: 401 }
    );
  }

  // 2. Validate the invoice number.
  const { invoiceNumber: invoiceNumberParam } = await params;
  const invoiceNumber = Number(invoiceNumberParam);

  if (
    !invoiceNumberParam ||
    !Number.isSafeInteger(invoiceNumber) ||
    invoiceNumber <= 0
  ) {
    return NextResponse.json(
      { error: "Invalid invoice number." },
      { status: 400 }
    );
  }

  // 3. Verify that the invoice belongs to the authenticated business.
  try {
    const [invoiceRows] = await pool.query<InvoiceRow[]>(
      `
      SELECT id, invoice_number, business_id
      FROM invoices
      WHERE invoice_number = ?
        AND business_id = ?
      LIMIT 1
      `,
      [invoiceNumber, currentUser.business_id]
    );

    if (invoiceRows.length === 0) {
      return NextResponse.json(
        { error: "Invoice not found." },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Invoice PDF authorization check failed:", error);

    return NextResponse.json(
      { error: "Unable to verify invoice access." },
      { status: 500 }
    );
  }

  let browser: Browser | null = null;

  try {
    // Use the same origin as the incoming request, including in production.
    const origin = req.nextUrl.origin;

    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    // 4. Pass the authenticated session to Puppeteer.
    await page.setCookie({
      name: "auth_token",
      value: authCookie.value,
      url: origin,
      path: "/",
      httpOnly: true,
      secure: origin.startsWith("https://"),
      sameSite: "Lax",
    });

    // 5. Render the existing invoice page.
    const pageResponse = await page.goto(
      `${origin}/invoices/${invoiceNumber}`,
      {
        waitUntil: "networkidle0",
        timeout: 30000,
      }
    );

    if (!pageResponse || !pageResponse.ok()) {
      console.error(
        "Invoice page returned an unsuccessful response:",
        pageResponse?.status()
      );

      return NextResponse.json(
        { error: "Unable to load the invoice for PDF generation." },
        { status: 500 }
      );
    }

    // 6. Generate the PDF.
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          `attachment; filename="invoice-${invoiceNumber}.pdf"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Invoice PDF generation failed:", error);

    return NextResponse.json(
      {
        error: "Failed to generate PDF.",
      },
      { status: 500 }
    );
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (error) {
        console.error("Failed to close Puppeteer browser:", error);
      }
    }
  }
}
