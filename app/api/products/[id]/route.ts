import { NextResponse, NextRequest } from "next/server";
import pool from "@/lib/db";
import { requireAuth } from "@/lib/auth";

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
  const currentUser = await requireAuth();
  
  if (currentUser.role !== "ADMIN") {
    return Response.json(
      {
        success: false,
        error: "Current user not authorized to update products."
      },
      {
        status: 403,
      }
    )
  }
  
  try {
    const { id } = await params;
    const body = await req.json();

    await pool.query(
      `
      UPDATE products
      SET
        sku = ?,
        name = ?,
        price = ?,
        stock_quantity = ?
      WHERE id = ?
      `,
      [
        body.sku,
        body.name,
        body.price,
        body.stock_quantity,
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
  const currentUser = await requireAuth();
  
  if (currentUser.role !== "ADMIN") {
    return Response.json(
      {
        success: false,
        error: "Current user not authorized to delete products."
      },
      {
        status: 403,
      }
    )
  }

  const { id } = await params;
  
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