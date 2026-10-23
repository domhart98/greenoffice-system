import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireApiAuth } from "@/lib/auth";

export async function GET() {
  try {
    const auth = await requireApiAuth();

    if (!auth.user) {
      return auth.response!;
    }

    const currentUser = auth.user;

    const [rows] = await pool.query(
      `
      SELECT
        e.id,
        e.expense_number,
        e.payee_id,
        p.name AS payee_name,
        p.payee_type,
        e.expense_date,
        e.payment_method,
        e.status,
        e.subtotal,
        e.vat_total,
        e.total,
        e.open_balance,
        e.memo,
        e.created_at,
        e.updated_at
      FROM expenses e
      LEFT JOIN payees p
        ON e.payee_id = p.id
        AND p.business_id = e.business_id
      WHERE e.business_id = ?
      ORDER BY e.expense_date DESC, e.id DESC
      `,
      [currentUser.business_id]
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching expenses:", error);

    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireApiAuth();

  if (!auth.user) {
    return auth.response!;
  }

  const currentUser = auth.user;
  const connection = await pool.getConnection();
  let transactionStarted = false;

  try {
    const body = await req.json();

    const {
      payee_id,
      expense_date,
      payment_method,
      status = "PAID",
      memo,
      items,
    } = body;

    if (!payee_id) {
      return NextResponse.json(
        { error: "Payee is required" },
        { status: 400 }
      );
    }

    if (!expense_date) {
      return NextResponse.json(
        { error: "Expense date is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "At least one expense item is required" },
        { status: 400 }
      );
    }

    await connection.beginTransaction();
    transactionStarted = true;

    const [payeeRows] = await connection.query(
      `
      SELECT id
      FROM payees
      WHERE id = ?
        AND business_id = ?
      FOR UPDATE
      `,
      [payee_id, currentUser.business_id]
    );

    if ((payeeRows as any[]).length === 0) {
      throw new Error("Payee not found");
    }

    const [lastExpenses] = await connection.query(
      `
      SELECT expense_number
      FROM expenses
      WHERE business_id = ?
      ORDER BY id DESC
      LIMIT 1
      FOR UPDATE
      `,
      [currentUser.business_id]
    );

    let nextNumber = 1;

    if ((lastExpenses as any[]).length > 0) {
      const lastNumber = (lastExpenses as any[])[0].expense_number;
      const match = String(lastNumber).match(/(\d+)$/);

      if (match) {
        nextNumber = Number(match[1]) + 1;
      }
    }

    const expenseNumber = `EXP-${String(nextNumber).padStart(6, "0")}`;

    let subtotal = 0;
    let vatTotal = 0;
    let total = 0;

    const processedItems: any[] = [];

    for (let index = 0; index < items.length; index++) {
      const item = items[index];

      const productId =
        item.product_id == null || item.product_id === ""
          ? null
          : Number(item.product_id);

      const categoryId =
        item.category_id == null || item.category_id === ""
          ? null
          : Number(item.category_id);

      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unit_price);
      const vatRate = Number(item.vat_rate ?? 0);

      if (
        (productId === null && categoryId === null) ||
        (productId !== null && categoryId !== null)
      ) {
        throw new Error(
          `Item ${index + 1} must have either a product or an expense category`
        );
      }

      if (
        productId !== null &&
        (!Number.isInteger(productId) || productId <= 0)
      ) {
        throw new Error(`Item ${index + 1} has an invalid product ID`);
      }

      if (
        categoryId !== null &&
        (!Number.isInteger(categoryId) || categoryId <= 0)
      ) {
        throw new Error(`Item ${index + 1} has an invalid category ID`);
      }

      if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new Error(
          `Item ${index + 1} must have a quantity greater than zero`
        );
      }

      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        throw new Error(`Item ${index + 1} has an invalid unit price`);
      }

      if (!Number.isFinite(vatRate) || vatRate < 0) {
        throw new Error(`Item ${index + 1} has an invalid VAT rate`);
      }

      if (productId !== null) {
        const [productRows] = await connection.query(
          `
          SELECT id
          FROM products
          WHERE id = ?
            AND business_id = ?
          FOR UPDATE
          `,
          [productId, currentUser.business_id]
        );

        if ((productRows as any[]).length === 0) {
          throw new Error(`Product ${productId} not found`);
        }
      }

      if (categoryId !== null) {
        const [categoryRows] = await connection.query(
          `
          SELECT id
          FROM expense_categories
          WHERE id = ?
            AND business_id = ?
          LIMIT 1
          `,
          [categoryId, currentUser.business_id]
        );

        if ((categoryRows as any[]).length === 0) {
          throw new Error("Expense category not found");
        }
      }

      const lineSubtotal = quantity * unitPrice;
      const lineVat = lineSubtotal * (vatRate / 100);
      const lineTotal = lineSubtotal + lineVat;

      subtotal += lineSubtotal;
      vatTotal += lineVat;
      total += lineTotal;

      processedItems.push({
        productId,
        categoryId,
        quantity,
        unitPrice,
        vatRate,
        description: item.description || null,
        subtotal: lineSubtotal,
        vatTotal: lineVat,
        total: lineTotal,
      });
    }

    const openBalance = status === "PAID" ? 0 : total;

    const [expenseResult] = await connection.query(
      `
      INSERT INTO expenses (
        business_id,
        payee_id,
        expense_number,
        expense_date,
        payment_method,
        status,
        subtotal,
        vat_total,
        total,
        open_balance,
        memo
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        currentUser.business_id,
        payee_id,
        expenseNumber,
        expense_date,
        payment_method || null,
        status,
        subtotal,
        vatTotal,
        total,
        openBalance,
        memo || null,
      ]
    );

    const expenseId = (expenseResult as any).insertId;

    for (let index = 0; index < processedItems.length; index++) {
      const item = processedItems[index];

      await connection.query(
        `
        INSERT INTO expense_items (
          expense_id,
          product_id,
          category_id,
          line_number,
          description,
          quantity,
          unit_price,
          subtotal,
          vat_rate,
          vat_total,
          total
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          expenseId,
          item.productId,
          item.categoryId,
          index + 1,
          item.description,
          item.quantity,
          item.unitPrice,
          item.subtotal,
          item.vatRate,
          item.vatTotal,
          item.total,
        ]
      );

      if (item.productId !== null) {
        const [productRows] = await connection.query(
          `
          SELECT id
          FROM products
          WHERE id = ?
            AND business_id = ?
          FOR UPDATE
          `,
          [item.productId, currentUser.business_id]
        );

        if ((productRows as any[]).length === 0) {
          throw new Error(`Product ${item.productId} not found`);
        }

        await connection.query(
          `
          UPDATE products
          SET stock_quantity = stock_quantity + ?
          WHERE id = ?
            AND business_id = ?
          `,
          [
            item.quantity,
            item.productId,
            currentUser.business_id,
          ]
        );

        await connection.query(
          `
          INSERT INTO stock_movements (
            product_id,
            movement_type,
            quantity,
            reference_number
          )
          VALUES (?, 'RESTOCK', ?, ?)
          `,
          [
            item.productId,
            item.quantity,
            expenseNumber,
          ]
        );
      }
    }

    await connection.commit();
    transactionStarted = false;

    return NextResponse.json(
      {
        success: true,
        expense_id: expenseId,
        expense_number: expenseNumber,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (transactionStarted) {
      await connection.rollback();
    }

    console.error("Error creating expense:", error);

    return NextResponse.json(
      {
        error: error.message || "Failed to create expense",
      },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}

