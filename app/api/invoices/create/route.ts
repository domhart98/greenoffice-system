import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(req: Request) {
  
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const body = await req.json();

    console.log("Body" + body.items);

    const [result] = await connection.query(
      `
      INSERT INTO invoices (
        invoice_number,
        customer_name,
        customer_address,
        invoice_date,
        terms,
        subtotal,
        vat,
        total
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        body.invoiceNumber,
        body.customerName,
        body.customerAddress,
        body.invoiceDate,
        body.terms,
        body.subtotal,
        body.vat,
        body.total,
      ]
    );

    const invoiceId = (result as any).insertId;

    console.log("Items received:", body.items);

    for (const item of body.items) {
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
                item.quantity,
                item.product_name,
                item.product_price,
                item.quantity * item.product_price, 
                (item.quantity * item.product_price) * (175/1000),
                (item.quantity * item.product_price) + ((item.quantity * item.product_price) * (175/1000))
            ]
        );
    }

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