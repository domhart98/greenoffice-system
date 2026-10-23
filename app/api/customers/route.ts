
import { NextResponse, NextRequest } from "next/server";
import pool from "@/lib/db";
import { requireApiAuth, requireAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireApiAuth();

    if (!auth.user) {
      return auth.response!;
    }

    const currentUser = auth.user;
    
    const search = req.nextUrl.searchParams.get("search") || "";

    let query = `
      SELECT *
      FROM customers
      WHERE business_id = ?
    `;

    const values: any[] = [currentUser.business_id];

    if (search.trim()) {
      query += `
        AND (
          CAST(id AS CHAR) LIKE ?
          OR name LIKE ?
        )
      `;

      values.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    query += ` ORDER BY id ASC`;

    const [rows] = await pool.query(query, values);

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Failed to fetch customers:", error);

    return NextResponse.json(
      { success: false, error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireApiAuth();

    if (!auth.user) {
      return auth.response!;
    }

    const currentUser = auth.user;
    
    const body = await req.json();

    if (!body.name?.trim()) {
      return NextResponse.json(
        { success: false, error: "Customer name is required" },
        { status: 400 }
      );
    }

    const [result] = await pool.query(
      `
      INSERT INTO customers (
        business_id,
        name,
        company_name,
        address,
        city,
        state,
        country,
        postal_code,
        phone,
        email,
        open_balance,
        notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        currentUser.business_id,
        body.name.trim(),
        body.company_name ?? null,
        body.address ?? null,
        body.city ?? null,
        body.state ?? null,
        body.country ?? null,
        body.postal_code ?? null,
        body.phone ?? null,
        body.email ?? null,
        body.open_balance ?? 0,
        body.notes ?? null,
      ]
    );

    const customerId = (result as any).insertId;

    await logAudit({
      userId: currentUser.id,
      action: "CREATE",
      entityName: "customers",
      recordId: customerId,
      newValues: body,
    });

    return NextResponse.json({
      success: true,
      id: customerId,
    });
  } catch (error) {
    console.error("Failed to create customer:", error);

    return NextResponse.json(
      { success: false, error: "Failed to create customer" },
      { status: 500 }
    );
  }
}
