import puppeteer from "puppeteer";
import { NextResponse, NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ invoiceNumber: string }> }
) {
  try{
    const authCookie = req.cookies.get("auth_token");
  
    const { invoiceNumber } = await params;

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    await page.setCookie({
      name: "auth_token",
      value: authCookie?.value ?? "",
      domain: "localhost",
      path: "/",
    });

    await page.goto(
      `http://localhost:3000/invoices/${invoiceNumber}`,
      {
        waitUntil: "networkidle0",
      }
    );

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          `attachment; filename=invoice-${invoiceNumber}.pdf`,
      },
    });
  } catch(error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate PDF",
      },
      {
        status: 500,
      }
    );
  }

}
