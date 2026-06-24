import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(req: Request) {
  

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

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
      
      //sum totals of each invoice item to get invoice totals
      subtotal += lineSubtotal;
      vat += lineVat;
      total += lineTotal;

      //Find product corresponding to invoice item. If requested quantity is greater than stock_quantity, throw error.
      const [rows]: any = await connection.query(
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
    }

    const [result] = await connection.query(
      `
      INSERT INTO invoices (
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
        customer_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
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
        body.customer_id 
      ]
    );

    const invoiceId = (result as any).insertId;

    for (const item of body.items) {
      const qty = Number(item.quantity);
      const price = Number(item.product_price);

      const lineSubtotal = qty * price;
      const lineVat = lineSubtotal * 0.175;
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
        vat_total,
        total
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          invoiceId,
          item.product_id || null,
          qty,
          item.product_name,
          price,
          lineSubtotal,
          lineVat,
          lineTotal
        ]
      );
    }

    await connection.query(
      `
      UPDATE invoices
      SET subtotal = ?, vat = ?, total = ?
      WHERE id = ?
      `,
      [subtotal, vat, total, invoiceId]
    );

    await connection.commit();

    return NextResponse.json({
      success: true,
      invoiceNumber: body.invoiceNumber,
    });

  } catch (error) {
    await connection.rollback();

    console.error(error);

    return NextResponse.json(
      {
        success: false,
      },
      {
        status: 500,
      }
    );
  } finally {
    connection.release();
  }
}