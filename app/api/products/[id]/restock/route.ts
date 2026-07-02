import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function PATCH(
    req: NextRequest,
    { params }: {
        params: Promise<{ id:string }>
    }
) {

    const { id } = await params;

    const body = await req.json();

    await pool.query(`
        UPDATE products
        SET stock_quantity =
            stock_quantity + ?
        WHERE id = ?
    `,
    [
        body.quantity,
        id
    ]);

    await pool.query(`
        INSERT INTO stock_movements (
            product_id,
            movement_type,
            quantity
        )
        VALUES (?, 'RESTOCK', ?)
    `,
    [
        id,
        body.quantity
    ]);

    return NextResponse.json({
        success:true
    });
}