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

function canManageInvoices(role: string): boolean {
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

  if (!canManageInvoices(currentUser.business_role)) {
    return NextResponse.json(
      { error: "You do not have permission to void invoices." },
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

    // 1. Lock an invoice belonging to the authenticated business.
    const [invoiceRows] = await connection.query<InvoiceRow[]>(
      `
      SELECT
        id,
        invoice_number,
        business_id,
        status,
        open_balance
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

    // 2. Preserve the existing rule: only UNPAID invoices can be voided.
    if (invoice.status !== "UNPAID") {
      throw new ApiError(
        `Invoice #${invoice.invoice_number} cannot be voided because its status is ${invoice.status}.`,
        400
      );
    }

    // 3. Do not void invoices with allocated payments.
    // This prevents the invoice being voided while payment records still
    // treat money as allocated to it.
    const [allocationRows] = await connection.query<
      (RowDataPacket & { allocation_count: number })[]
    >(
      `
      SELECT COUNT(*) AS allocation_count
      FROM payment_allocations pa
      INNER JOIN payments p
        ON p.id = pa.payment_id
       AND p.business_id = ?
      WHERE pa.invoice_id = ?
      `,
      [currentUser.business_id, invoice.id]
    );

    if (Number(allocationRows[0]?.allocation_count ?? 0) > 0) {
      throw new ApiError(
        "This invoice has allocated payments. Reverse or reallocate those payments before voiding the invoice.",
        409
      );
    }

    // 4. Get invoice items from the verified invoice.
    const [items] = await connection.query<InvoiceItemRow[]>(
      `
      SELECT id, product_id, product_name, quantity
      FROM invoice_items
      WHERE invoice_id = ?
      ORDER BY line_number ASC, id ASC
      `,
      [invoice.id]
    );

    // Aggregate quantities where a product appears on multiple lines.
    const productQuantities = new Map<number, number>();

    for (const item of items) {
      if (item.product_id == null) {
        continue;
      }

      const quantity = Number(item.quantity);
      const productId = Number(item.product_id);

      if (
        !Number.isSafeInteger(quantity) ||
        quantity <= 0 ||
        !Number.isSafeInteger(productId) ||
        productId <= 0
      ) {
        throw new ApiError(
          `Invalid product or quantity for invoice item ${item.id}.`
        );
      }

      productQuantities.set(
        productId,
        (productQuantities.get(productId) ?? 0) + quantity
      );
    }

    // 5. Lock and verify products in the authenticated business.
    const productsToRestore: {
      id: number;
      name: string;
      quantity: number;
    }[] = [];

    for (const [productId, quantity] of productQuantities) {
      const [productRows] = await connection.query<ProductRow[]>(
        `
        SELECT id, name, type, stock_quantity, business_id
        FROM products
        WHERE id = ?
          AND business_id = ?
        FOR UPDATE
        `,
        [productId, currentUser.business_id]
      );

      if (productRows.length === 0) {
        throw new ApiError(
          `Product ${productId} was not found in your business.`,
          400
        );
      }

      const product = productRows[0];

      // Only inventory products have stock restored.
      if (product.type !== "PRODUCT") {
        continue;
      }

      productsToRestore.push({
        id: product.id,
        name: product.name,
        quantity,
      });
    }

    // 6. Restore stock and record each reversal.
    for (const product of productsToRestore) {
      const [updateResult] = await connection.query<ResultSetHeader>(
        `
        UPDATE products
        SET stock_quantity = stock_quantity + ?
        WHERE id = ?
          AND business_id = ?
        `,
        [
          product.quantity,
          product.id,
          currentUser.business_id,
        ]
      );

      if (updateResult.affectedRows !== 1) {
        throw new ApiError(
          `Could not restore stock for ${product.name}.`,
          409
        );
      }

      // Keep the original SALE movement and record the reversal.
      await connection.query(
        `
        INSERT INTO stock_movements (
          product_id,
          movement_type,
          quantity,
          reference_number
        )
        VALUES (?, 'ADJUSTMENT', ?, ?)
        `,
        [
          product.id,
          product.quantity,
          `VOID-${invoice.invoice_number}`,
        ]
      );
    }

    // 7. Void the invoice, scoped to the business and expected status.
    const [invoiceUpdate] = await connection.query<ResultSetHeader>(
      `
      UPDATE invoices
      SET status = 'VOID',
          open_balance = 0
      WHERE id = ?
        AND business_id = ?
        AND status = 'UNPAID'
      `,
      [invoice.id, currentUser.business_id]
    );

    if (invoiceUpdate.affectedRows !== 1) {
      throw new ApiError(
        "The invoice could not be voided. Its status may have changed.",
        409
      );
    }

    // 8. Record the audit event.
    // Assumes audit_logs.business_id exists.
    await connection.query(
      `
      INSERT INTO audit_logs (
        business_id,
        action,
        entity_name,
        record_id,
        description,
        old_values,
        new_values
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        currentUser.business_id,
        "UPDATE",
        "invoices",
        invoice.id,
        `Invoice ${invoice.invoice_number} voided.`,
        JSON.stringify({
          status: invoice.status,
          open_balance: invoice.open_balance,
        }),
        JSON.stringify({
          status: "VOID",
          open_balance: 0,
        }),
      ]
    );

    await connection.commit();
    transactionStarted = false;

    return NextResponse.json({
      success: true,
      message: `Invoice ${invoice.invoice_number} has been voided.`,
    });
  } catch (error: unknown) {
    if (transactionStarted) {
      await connection.rollback();
    }

    console.error("Void invoice error:", error);

    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: "Failed to void invoice." },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}