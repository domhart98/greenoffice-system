import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
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

type InvoiceRow = RowDataPacket & {
  id: number;
  invoice_number: number;
  business_id: number;
  status: string;
  open_balance: number | string | null;
  total: number | string;
};

type InvoiceItemRow = RowDataPacket & {
  id: number;
  product_id: number | null;
  product_name: string | null;
  quantity: number | string;
};

type ProductRow = RowDataPacket & {
  id: number;
  name: string;
  type: string;
  stock_quantity: number | string;
  business_id: number;
};

function canIssueInvoices(role: string): boolean {
  return role === "OWNER" || role === "ADMIN";
}

export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  const auth = await requireApiAuth();

  if (auth.response) {
    return auth.response;
  }

  const currentUser = auth.user;

  if (!currentUser) {
    return;
  }

  if (!canIssueInvoices(currentUser.business_role)) {
    return NextResponse.json(
      { error: "You do not have permission to issue invoices." },
      { status: 403 }
    );
  }

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

  const connection = await pool.getConnection();
  let transactionStarted = false;

  try {
    await connection.beginTransaction();
    transactionStarted = true;

    // 1. Lock only an invoice belonging to the authenticated business.
    const [invoiceRows] = await connection.query<InvoiceRow[]>(
      `
      SELECT id, invoice_number, business_id, status, open_balance, total
      FROM invoices
      WHERE invoice_number = ?
        AND business_id = ?
      FOR UPDATE
      `,
      [invoiceNumber, currentUser.business_id]
    );

    if (invoiceRows.length === 0) {
      throw new ApiError("Invoice not found.", 404);
    }

    const invoice = invoiceRows[0];

    // 2. Only draft invoices can be issued.
    if (invoice.status !== "DRAFT") {
      throw new ApiError(
        `Invoice cannot be issued because its current status is ${invoice.status}.`,
        400
      );
    }

    // 3. Retrieve items through the verified invoice.
    const [items] = await connection.query<InvoiceItemRow[]>(
      `
      SELECT id, product_id, product_name, quantity
      FROM invoice_items
      WHERE invoice_id = ?
      ORDER BY line_number ASC, id ASC
      `,
      [invoice.id]
    );

    if (items.length === 0) {
      throw new ApiError("Cannot issue an invoice with no items.", 400);
    }

    // 4. Deduct inventory for stock-tracked products.
    for (const item of items) {
      // Items without a product are treated as services or custom line items.
      if (item.product_id == null) {
        continue;
      }

      const [productRows] = await connection.query<ProductRow[]>(
        `
        SELECT id, name, type, stock_quantity, business_id
        FROM products
        WHERE id = ?
          AND business_id = ?
        FOR UPDATE
        `,
        [item.product_id, currentUser.business_id]
      );

      if (productRows.length === 0) {
        throw new ApiError(
          `Product not found in your business: ${item.product_name || item.product_id}.`,
          400
        );
      }

      const product = productRows[0];

      if (product.type === "SERVICE") {
        continue;
      }

      const availableStock = Number(product.stock_quantity);
      const requiredQuantity = Number(item.quantity);

      if (
        !Number.isFinite(requiredQuantity) ||
        requiredQuantity <= 0
      ) {
        throw new ApiError(
          `Invalid quantity for ${product.name}.`,
          400
        );
      }

      if (availableStock < requiredQuantity) {
        throw new ApiError(
          `Insufficient stock for ${product.name}. Available: ${availableStock}, required: ${requiredQuantity}.`,
          400
        );
      }

      // The business_id condition provides a second tenant-isolation check.
      const [updateResult] = await connection.query<ResultSetHeader>(
        `
        UPDATE products
        SET stock_quantity = stock_quantity - ?
        WHERE id = ?
          AND business_id = ?
          AND stock_quantity >= ?
        `,
        [
          requiredQuantity,
          product.id,
          currentUser.business_id,
          requiredQuantity,
        ]
      );

      if (updateResult.affectedRows !== 1) {
        throw new ApiError(
          `Unable to update stock for ${product.name}. Please try again.`,
          409
        );
      }

      // Record the stock movement in the same transaction.
      await connection.query(
        `
        INSERT INTO stock_movements (
          product_id,
          movement_type,
          quantity,
          reference_number
        )
        VALUES (?, 'SALE', ?, ?)
        `,
        [
          product.id,
          requiredQuantity,
          String(invoiceNumber),
        ]
      );
    }

    // 5. Mark the invoice as issued, scoped to the business.
    const [invoiceUpdate] = await connection.query<ResultSetHeader>(
      `
      UPDATE invoices
      SET status = 'UNPAID',
          open_balance = total
      WHERE id = ?
        AND business_id = ?
        AND status = 'DRAFT'
      `,
      [invoice.id, currentUser.business_id]
    );

    if (invoiceUpdate.affectedRows !== 1) {
      throw new ApiError(
        "The invoice could not be issued. Its status may have changed.",
        409
      );
    }

    // 6. Record the audit event.
    // Assumes audit_logs has business_id, as planned for tenant isolation.
    await connection.query(
      `
      INSERT INTO audit_logs (
        business_id,
        action,
        entity_name,
        description,
        old_values,
        new_values
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        currentUser.business_id,
        "UPDATE",
        "invoices",
        `Invoice ${invoiceNumber} issued`,
        JSON.stringify({
          status: invoice.status,
          open_balance: invoice.open_balance,
        }),
        JSON.stringify({
          status: "UNPAID",
          open_balance: invoice.total,
        }),
      ]
    );

    await connection.commit();
    transactionStarted = false;

    return NextResponse.json({
      success: true,
      message: `Invoice ${invoiceNumber} issued successfully.`,
    });
  } catch (error: unknown) {
    if (transactionStarted) {
      await connection.rollback();
    }

    console.error("Error issuing invoice:", error);

    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: "Failed to issue invoice." },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}