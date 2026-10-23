import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireApiAuth } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ invoiceNumber: string }>;
};

class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

function canManageInvoices(role: string | undefined) {
  return role === "OWNER" || role === "ADMIN";
}

export async function GET(
  req: NextRequest,
  { params }: RouteContext
) {
  const auth = await requireApiAuth();

  if (auth.response) {
    return auth.response;
  }

  const currentUser = auth.user;

  try {
    const { invoiceNumber } = await params;

    const [invoiceRows]: any = await pool.query(
      `
      SELECT *
      FROM invoices
      WHERE invoice_number = ?
        AND business_id = ?
      LIMIT 1
      `,
      [invoiceNumber, currentUser.business_id]
    );

    const invoice = invoiceRows[0];

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    const [itemRows]: any = await pool.query(
      `
      SELECT *
      FROM invoice_items
      WHERE invoice_id = ?
      `,
      [invoice.id]
    );

    const [paymentRows]: any = await pool.query(
      `
      SELECT
        pa.*,
        p.payment_number,
        p.payment_date,
        p.amount AS payment_amount,
        p.payment_method
      FROM payment_allocations pa
      INNER JOIN payments p
        ON p.id = pa.payment_id
      WHERE pa.invoice_id = ?
        AND p.business_id = ?
      ORDER BY p.payment_date ASC, p.id ASC
      `,
      [invoice.id, currentUser.business_id]
    );

    return NextResponse.json({
      invoice,
      items: itemRows,
      payments: paymentRows,
    });
  } catch (error) {
    console.error("Error fetching invoice:", error);

    return NextResponse.json(
      { error: "Failed to fetch invoice" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: RouteContext
) {
  const auth = await requireApiAuth();

  if (auth.response) {
    return auth.response;
  }

  const currentUser = auth.user;
  const businessId = currentUser.business_id;

  if (!canManageInvoices(currentUser.business_role)) {
    return NextResponse.json(
      {
        success: false,
        error: "You are not authorized to update invoices.",
      },
      { status: 403 }
    );
  }

  const connection = await pool.getConnection();
  let transactionStarted = false;

  try {
    const { invoiceNumber } = await params;
    const body = await req.json();

    if (!Array.isArray(body.items)) {
      throw new ApiError("Invoice items must be provided as an array.");
    }

    await connection.beginTransaction();
    transactionStarted = true;

    const [invoiceRows]: any = await connection.query(
      `
      SELECT *
      FROM invoices
      WHERE invoice_number = ?
        AND business_id = ?
      LIMIT 1
      FOR UPDATE
      `,
      [invoiceNumber, businessId]
    );

    const invoice = invoiceRows[0];

    if (!invoice) {
      throw new ApiError("Invoice not found.", 404);
    }

    if (body.customer_id) {
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
    } else {
      throw new ApiError("A customer is required.");
    }

    const submittedItemIds = body.items
      .map((item: { id?: number | string }) => Number(item.id))
      .filter(
        (id: number) => Number.isInteger(id) && id > 0
      );

    const uniqueItemIds = [...new Set(submittedItemIds)];

    if (uniqueItemIds.length !== submittedItemIds.length) {
      throw new ApiError("Duplicate invoice item IDs were submitted.");
    }

    if (uniqueItemIds.length > 0) {
      const placeholders = uniqueItemIds.map(() => "?").join(", ");

      const [existingItemRows]: any = await connection.query(
        `
        SELECT id
        FROM invoice_items
        WHERE invoice_id = ?
          AND id IN (${placeholders})
        `,
        [invoice.id, ...uniqueItemIds]
      );

      if (existingItemRows.length !== uniqueItemIds.length) {
        throw new ApiError(
          "One or more invoice items do not belong to this invoice.",
          400
        );
      }

      await connection.query(
        `
        DELETE FROM invoice_items
        WHERE invoice_id = ?
          AND id NOT IN (${placeholders})
        `,
        [invoice.id, ...uniqueItemIds]
      );
    } else {
      await connection.query(
        `
        DELETE FROM invoice_items
        WHERE invoice_id = ?
        `,
        [invoice.id]
      );
    }

    let subtotal = 0;
    let vat = 0;
    let total = 0;

    for (const item of body.items) {
      const qty = Number(item.quantity);
      const price = Number(item.product_price);
      const vatRate =
        item.vat_rate === undefined || item.vat_rate === null
          ? 17.5
          : Number(item.vat_rate);

      if (!Number.isFinite(qty) || qty <= 0) {
        throw new ApiError(
          "Invoice item quantity must be greater than zero."
        );
      }

      if (!Number.isFinite(price) || price < 0) {
        throw new ApiError(
          "Invoice item price cannot be negative."
        );
      }

      if (!Number.isFinite(vatRate) || vatRate < 0) {
        throw new ApiError("Invalid VAT rate.");
      }

      if (item.product_id) {
        const [productRows]: any = await connection.query(
          `
          SELECT id, stock_quantity, name
          FROM products
          WHERE id = ?
            AND business_id = ?
          LIMIT 1
          `,
          [item.product_id, businessId]
        );

        const product = productRows[0];

        if (!product) {
          throw new ApiError(
            `Product ${item.product_id} was not found in your business.`,
            404
          );
        }

        if (qty > Number(product.stock_quantity)) {
          throw new ApiError(
            `${product.name} only has ${product.stock_quantity} units available.`,
            400
          );
        }
      }

      const lineSubtotal = qty * price;
      const lineVat = lineSubtotal * (vatRate / 100);
      const lineTotal = lineSubtotal + lineVat;

      subtotal += lineSubtotal;
      vat += lineVat;
      total += lineTotal;

      if (item.id) {
        const [updateResult]: any = await connection.query(
          `
          UPDATE invoice_items
          SET
            product_id = ?,
            quantity = ?,
            product_name = ?,
            product_price = ?,
            vat_rate = ?,
            subtotal = ?,
            vat_total = ?,
            total = ?
          WHERE id = ?
            AND invoice_id = ?
          `,
          [
            item.product_id || null,
            qty,
            item.product_name,
            price,
            vatRate,
            lineSubtotal,
            lineVat,
            lineTotal,
            Number(item.id),
            invoice.id,
          ]
        );

        if (updateResult.affectedRows !== 1) {
          throw new ApiError(
            "Failed to update an invoice item."
          );
        }
      } else {
        await connection.query(
          `
          INSERT INTO invoice_items (
            invoice_id,
            product_id,
            quantity,
            product_name,
            product_price,
            vat_rate,
            subtotal,
            vat_total,
            total
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            invoice.id,
            item.product_id || null,
            qty,
            item.product_name,
            price,
            vatRate,
            lineSubtotal,
            lineVat,
            lineTotal,
          ]
        );
      }
    }

    await connection.query(
      `
      UPDATE invoices
      SET
        invoice_number = ?,
        customer_name = ?,
        customer_address = ?,
        invoice_date = ?,
        terms = ?,
        subtotal = ?,
        vat = ?,
        total = ?,
        customer_email = ?,
        customer_phone = ?,
        customer_id = ?
      WHERE id = ?
        AND business_id = ?
      `,
      [
        body.invoice_number,
        body.customer_name,
        body.customer_address,
        body.invoice_date,
        body.terms,
        subtotal,
        vat,
        total,
        body.customer_email,
        body.customer_phone,
        body.customer_id,
        invoice.id,
        businessId,
      ]
    );

    await connection.commit();
    transactionStarted = false;

    return NextResponse.json({ success: true });
  } catch (error) {
    if (transactionStarted) {
      await connection.rollback();
    }

    console.error("Error updating invoice:", error);

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
        error: "Failed to update invoice",
      },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: RouteContext
) {
  const auth = await requireApiAuth();

  if (auth.response) {
    return auth.response;
  }

  const currentUser = auth.user;

  if (!canManageInvoices(currentUser.business_role)) {
    return NextResponse.json(
      {
        success: false,
        error: "You are not authorized to delete invoices.",
      },
      { status: 403 }
    );
  }

  try {
    const { invoiceNumber } = await params;

    const [result]: any = await pool.query(
      `
      DELETE FROM invoices
      WHERE invoice_number = ?
        AND business_id = ?
      `,
      [invoiceNumber, currentUser.business_id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting invoice:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete invoice",
      },
      { status: 500 }
    );
  }
}
