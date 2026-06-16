import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(req: Request) {
  
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const body = await req.json();

    const [result] = await connection.query(
      `
      INSERT INTO customers (
        name,
        address,
        phone,
        email,
        notes
      )
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        body.name,
        body.address,
        body.phone,
        body.email,
        body.notes,
      ]
    );

    const customerId = (result as any).insertId;

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