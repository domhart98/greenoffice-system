import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(req: Request) {
  
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const body = await req.json();

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
            description,
            rate,
            amount
            )
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                invoiceId,
                item.productId || null,
                item.quantity,
                item.description,
                item.rate,
                item.quantity * item.rate,
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