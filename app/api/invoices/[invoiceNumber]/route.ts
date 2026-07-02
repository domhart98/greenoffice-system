import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { InvoiceItem } from "@/types/invoice";
import { requireAuth } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ invoiceNumber: string }> }
) {
  try {
    const { invoiceNumber } = await params;

    const [invoiceRows] = await pool.query(
      `
      SELECT *
      FROM invoices
      WHERE invoice_number = ?
      `,
      [invoiceNumber]
    );

    const invoice = (invoiceRows as any[])[0];

    if (!invoice) {
      return;
    }

    const [itemRows] = await pool.query(
      `
      SELECT *
      FROM invoice_items
      WHERE invoice_id = ?
      `,
      [invoice.id]
    );

    return NextResponse.json({
      invoice: (invoiceRows as any[])[0],
      items: itemRows,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to fetch invoice" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextResponse,
  { params }: {params: Promise<{invoiceNumber: string}>}
) {
  const currentUser = await requireAuth();

  if (currentUser.role !== "ADMIN") {
    return Response.json(
      {
        success: false,
        error: "Current user not authorized to update invoices."
      },
      {
        status: 403,
      }
    )
  }

  try{
    const {invoiceNumber} = await params;
    const body = await req.json();
    
    let subtotal = 0;
    let vat = 0;
    let total = 0;

    for (const item of body.items) {
      const qty = Number(item.quantity);
      const price = Number(item.product_price);

      const lineSubtotal = qty * price;
      const lineVat = lineSubtotal * 0.175;
      const lineTotal = lineSubtotal + lineVat;
      
      subtotal += lineSubtotal;
      vat += lineVat;
      total += lineTotal;

      const [rows]: any = await pool.query(
        `
        SELECT stock_quantity, name
        FROM products
        WHERE id = ?
        `,
        [item.product_id]
      );

      const product = rows[0];

      if (!product) {
        throw new Error("Product not found");
      }

      if (item.quantity > product.stock_quantity) {
        throw new Error(
          `${product.name} only has ${product.stock_quantity} units available`
        );
      }

      await pool.query(
        `
        UPDATE invoice_items
        SET
          product_id = ?,
          quantity = ?,
          product_name = ?,
          product_price = ?
        WHERE id = ?
        `,
        [
          item.product_id,
          item.quantity,
          item.product_name,
          item.product_price,
          item.id
        ]
      )
    }

    await pool.query(
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
      WHERE invoice_number = ?
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
        invoiceNumber
      ]
    )
    return NextResponse.json({ success: true });

  } catch(error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update invoice",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ invoiceNumber: string }> }
) {
  const currentUser = await requireAuth();

  if (currentUser.role !== "ADMIN") {
    return Response.json(
      {
        success: false,
        error: "Current user not authorized to delete invoices."
      },
      {
        status: 403,
      }
    )
  }

  try{
    const { invoiceNumber } = await params;
    
    //Invoice items are delete using foreign key constraint with ON DELETE CASCADE
    await pool.query(
      `
      DELETE FROM invoices
      WHERE invoice_number = ?
      `,
      [invoiceNumber]
    );

    return NextResponse.json({
      success: true,
    });
  } catch(error) {
    console.error(error);

    return Response.json(
      {
        success: false,
        error: "Failed to delete invoice",
      },
      {
        status: 500,
      }
    );
  }
}