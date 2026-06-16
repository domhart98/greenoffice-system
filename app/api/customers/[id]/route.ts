import { NextResponse, NextRequest } from "next/server";
import pool from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [customerRows] = await pool.query(
      `
      SELECT *
      FROM customers
      WHERE id = ?
      `,
      [id]
    );

    return NextResponse.json({
      customer: (customerRows as any[])[0],
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
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    await pool.query(
      `
      UPDATE customers
      SET
        name = ?,
        address = ?,
        phone = ?,
        email = ?,
        notes = ?
      WHERE id = ?
      `,
      [
        body.name,
        body.address,
        body.phone,
        body.email,
        body.notes,
        body.id,
      ]
    )
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update customer",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [rows]: any = await pool.query(
    `
    SELECT COUNT(*) AS total
    FROM invoices
    WHERE customer_id = ?
    `,
    [id]
  )

  if (rows[0].total > 0){
    return NextResponse.json({
        error: "Cannot Delete, Customer has invoices",
    },
    {
      status: 400,
    });
  }
  
  await pool.query(
    `
    DELETE FROM customers
    WHERE id = ?
    `,
    [id]
  );

  return NextResponse.json({
    success: true,
  });
}