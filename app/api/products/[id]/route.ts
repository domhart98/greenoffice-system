import { NextResponse, NextRequest } from "next/server";
import pool from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [productRows] = await pool.query(
      `
      SELECT *
      FROM products
      WHERE id = ?
      `,
      [id]
    );

    return NextResponse.json({
      product: (productRows as any[])[0],
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
      UPDATE products
      SET
        sku = ?,
        name = ?,
        price = ?
      WHERE id = ?
      `,
      [
        body.sku,
        body.name,
        body.price,
        id
      ]
    )
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update product",
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
    WHERE product_id = ?
    `,
    [id]
  )

  if (rows[0].total > 0){
    return NextResponse.json({
        error: "Cannot Delete, product has invoices",
    },
    {
      status: 400,
    });
  }
  
  await pool.query(
    `
    DELETE FROM products
    WHERE id = ?
    `,
    [id]
  );

  return NextResponse.json({
    success: true,
  });
}