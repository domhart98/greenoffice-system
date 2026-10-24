import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireApiAuth } from "@/lib/auth";

class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export async function GET(req: NextRequest) {
  const auth = await requireApiAuth();

  if (auth.response) {
    return auth.response;
  }

  const currentUser = auth.user;

  if (!currentUser) {
    return;
  }

  try {
    const searchParams = req.nextUrl.searchParams;

    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "";
    const sort = searchParams.get("sort") || "newest";

    let query = `
      SELECT *
      FROM invoices
      WHERE business_id = ?
    `;

    const values: (string | number)[] = [
      currentUser.business_id,
    ];

    if (search) {
      query += `
        AND (
          customer_name LIKE ?
          OR CAST(invoice_number AS CHAR) LIKE ?
        )
      `;

      values.push(`%${search}%`, `%${search}%`);
    }

    if (status && status !== "ALL") {
      query += ` AND status = ?`;
      values.push(status);
    }

    // Whitelist supported sort options.
    switch (sort) {
      case "oldest":
        query += " ORDER BY created_at ASC";
        break;
      case "highest":
        query += " ORDER BY total DESC";
        break;
      case "lowest":
        query += " ORDER BY total ASC";
        break;
      case "newest":
      default:
        query += " ORDER BY created_at DESC";
        break;
    }

    const [rows] = await pool.query(query, values);

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching invoices:", error);

    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const auth = await requireApiAuth();

  if (auth.response) {
    return auth.response;
  }

  const currentUser = auth.user;

  if (!currentUser) {
    return;
  }
  
  const businessId = currentUser.business_id;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const body = await req.json();

    if (!Array.isArray(body.items) || body.items.length === 0) {
      throw new ApiError("An invoice must contain at least one item.");
    }

    if (!body.customer_id) {
      throw new ApiError("A customer is required.");
    }

    const [customerRows]: any = await connection.query(
      `
      SELECT id
      FROM customers
      WHERE id = ?
        AND business_id = ?
      LIMIT 1
      `,
      [body.customer_id, businessId]
    );

    if (customerRows.length === 0) {
      throw new ApiError(
        "Customer not found in your business.",
        404
      );
    }

    let subtotal = 0;
    let vat = 0;
    let total = 0;

    for (const item of body.items) {
      const qty = Number(item.quantity);
      const price = Number(item.product_price);
      const vatRate = Number(item.vat_rate) || 0;

      if (
        !Number.isFinite(qty) ||
        qty <= 0 ||
        !Number.isFinite(price) ||
        price < 0 ||
        !Number.isFinite(vatRate) ||
        vatRate < 0
      ) {
        throw new ApiError("Invalid invoice item values.");
      }

      if (item.product_id) {
        const [productRows]: any = await connection.query(
          `
          SELECT id
          FROM products
          WHERE id = ?
            AND business_id = ?
          LIMIT 1
          `,
          [item.product_id, businessId]
        );

        if (productRows.length === 0) {
          throw new ApiError(
            `Product ${item.product_id} was not found in your business.`,
            404
          );
        }
      }

      const lineSubtotal = qty * price;
      const lineVat = lineSubtotal * (vatRate / 100);
      const lineTotal = lineSubtotal + lineVat;

      subtotal += lineSubtotal;
      vat += lineVat;
      total += lineTotal;
    }

    const [result]: any = await connection.query(
      `
      INSERT INTO invoices (
        business_id,
        invoice_number,
        customer_name,
        customer_address,
        invoice_date,
        due_date,
        terms,
        subtotal,
        vat,
        total,
        customer_email,
        customer_phone,
        customer_id,
        status,
        open_balance
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        businessId,
        body.invoice_number,
        body.customer_name,
        body.customer_address,
        body.invoice_date,
        body.due_date,
        body.terms,
        subtotal,
        vat,
        total,
        body.customer_email,
        body.customer_phone,
        body.customer_id,
        "DRAFT",
        0,
      ]
    );

    const invoiceId = result.insertId;

    for (const item of body.items) {
      const qty = Number(item.quantity);
      const price = Number(item.product_price);
      const vatRate = Number(item.vat_rate) || 0;

      const lineSubtotal = qty * price;
      const lineVat = lineSubtotal * (vatRate / 100);
      const lineTotal = lineSubtotal + lineVat;

      await connection.query(
        `
        INSERT INTO invoice_items (
          invoice_id,
          product_id,
          quantity,
          product_name,
          product_price,
          subtotal,
          vat_rate,
          vat_total,
          total
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          invoiceId,
          item.product_id || null,
          qty,
          item.product_name,
          price,
          lineSubtotal,
          vatRate,
          lineVat,
          lineTotal,
        ]
      );
    }

    await connection.commit();

    return NextResponse.json({
      success: true,
      invoiceNumber: body.invoice_number,
    });
  } catch (error) {
    await connection.rollback();

    console.error("Error creating invoice:", error);

    if (error instanceof ApiError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create invoice",
      },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}
