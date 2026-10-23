import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireApiAuth } from "@/lib/auth";

type RouteParams = {
  params: Promise<{ id: string }>;
};

const canEditExpenses = (role: string) =>
  role === "OWNER" || role === "ADMIN";

export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const auth = await requireApiAuth();

    if (!auth.user) {
      return auth.response!;
    }

    const currentUser = auth.user;
    const { id } = await params;
    const expenseId = Number(id);

    if (!Number.isInteger(expenseId) || expenseId <= 0) {
      return NextResponse.json(
        { error: "Invalid expense ID" },
        { status: 400 }
      );
    }

    const [expenseRows] = await pool.query(
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
      WHERE e.id = ?
        AND e.business_id = ?
      LIMIT 1
      `,
      [expenseId, currentUser.business_id]
    );

    const expense = (expenseRows as any[])[0];

    if (!expense) {
      return NextResponse.json(
        { error: "Expense not found" },
        { status: 404 }
      );
    }

    const [itemRows] = await pool.query(
      `
      SELECT *
      FROM expense_items
      WHERE expense_id = ?
      ORDER BY line_number ASC, id ASC
      `,
      [expense.id]
    );

    return NextResponse.json({
      expense,
      items: itemRows,
    });
  } catch (error) {
    console.error("Error fetching expense:", error);

    return NextResponse.json(
      { error: "Failed to fetch expense" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, { params }: RouteParams) {
  const auth = await requireApiAuth();

  if (!auth.user) {
    return auth.response!;
  }

  const currentUser = auth.user;

  if (!canEditExpenses(currentUser.business_role)) {
    return NextResponse.json(
      {
        success: false,
        error: "You are not authorized to update expenses.",
      },
      { status: 403 }
    );
  }

  const { id } = await params;
  const expenseId = Number(id);

  if (!Number.isInteger(expenseId) || expenseId <= 0) {
    return NextResponse.json(
      { error: "Invalid expense ID" },
      { status: 400 }
    );
  }

  const connection = await pool.getConnection();
  let transactionStarted = false;

  try {
    const body = await req.json();

    if (!Array.isArray(body.items)) {
      return NextResponse.json(
        { error: "Expense items must be provided as an array" },
        { status: 400 }
      );
    }

    await connection.beginTransaction();
    transactionStarted = true;

    const [expenseRows] = await connection.query(
      `
      SELECT id
      FROM expenses
      WHERE id = ?
        AND business_id = ?
      FOR UPDATE
      `,
      [expenseId, currentUser.business_id]
    );

    if ((expenseRows as any[]).length === 0) {
      await connection.rollback();
      transactionStarted = false;

      return NextResponse.json(
        { error: "Expense not found" },
        { status: 404 }
      );
    }

    const payeeId = Number(body.payee_id);

    if (!Number.isInteger(payeeId) || payeeId <= 0) {
      await connection.rollback();
      transactionStarted = false;

      return NextResponse.json(
        { error: "A valid payee is required" },
        { status: 400 }
      );
    }

    const [payeeRows] = await connection.query(
      `
      SELECT id
      FROM payees
      WHERE id = ?
        AND business_id = ?
      LIMIT 1
      `,
      [payeeId, currentUser.business_id]
    );

    if ((payeeRows as any[]).length === 0) {
      await connection.rollback();
      transactionStarted = false;

      return NextResponse.json(
        { error: "Payee not found" },
        { status: 400 }
      );
    }

    let subtotal = 0;
    let vat = 0;
    let total = 0;

    const submittedItemIds = body.items
      .map((item: { id?: number | string }) =>
        item.id == null ? null : Number(item.id)
      )
      .filter(
        (itemId: number | null) =>
          itemId !== null &&
          Number.isInteger(itemId) &&
          itemId > 0
      );

    if (submittedItemIds.length > 0) {
      const placeholders = submittedItemIds.map(() => "?").join(", ");

      await connection.query(
        `
        DELETE FROM expense_items
        WHERE expense_id = ?
          AND id NOT IN (${placeholders})
        `,
        [expenseId, ...submittedItemIds]
      );
    } else {
      await connection.query(
        `
        DELETE FROM expense_items
        WHERE expense_id = ?
        `,
        [expenseId]
      );
    }

    for (const item of body.items) {
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unit_price);
      const vatRate = Number(item.vat_rate);

      if (
        !Number.isFinite(quantity) ||
        quantity <= 0 ||
        !Number.isFinite(unitPrice) ||
        unitPrice < 0 ||
        !Number.isFinite(vatRate) ||
        vatRate < 0
      ) {
        throw new Error("An expense item contains invalid values");
      }

      const productId =
        item.product_id == null || item.product_id === ""
          ? null
          : Number(item.product_id);

      const categoryId =
        item.category_id == null || item.category_id === ""
          ? null
          : Number(item.category_id);

      if (
        (productId === null && categoryId === null) ||
        (productId !== null && categoryId !== null)
      ) {
        throw new Error(
          "Each expense item must reference either a product or a category"
        );
      }

      if (
        productId !== null &&
        (!Number.isInteger(productId) || productId <= 0)
      ) {
        throw new Error("Invalid product ID");
      }

      if (
        categoryId !== null &&
        (!Number.isInteger(categoryId) || categoryId <= 0)
      ) {
        throw new Error("Invalid expense category ID");
      }

      if (productId !== null) {
        const [productRows] = await connection.query(
          `
          SELECT id, stock_quantity, name
          FROM products
          WHERE id = ?
            AND business_id = ?
          LIMIT 1
          `,
          [productId, currentUser.business_id]
        );

        const product = (productRows as any[])[0];

        if (!product) {
          throw new Error("Product not found");
        }

        if (quantity > Number(product.stock_quantity)) {
          throw new Error(
            `${product.name} only has ${product.stock_quantity} units available`
          );
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
      vat += lineVat;
      total += lineTotal;

      const itemValues = [
        expenseId,
        productId,
        categoryId,
        item.line_number,
        item.description ?? null,
        quantity,
        unitPrice,
        vatRate,
        lineSubtotal,
        lineVat,
        lineTotal,
      ];

      if (item.id != null) {
        const itemId = Number(item.id);

        if (!Number.isInteger(itemId) || itemId <= 0) {
          throw new Error("Invalid expense item ID");
        }

        const [updateResult] = await connection.query(
          `
          UPDATE expense_items
          SET
            expense_id = ?,
            product_id = ?,
            category_id = ?,
            line_number = ?,
            description = ?,
            quantity = ?,
            unit_price = ?,
            vat_rate = ?,
            subtotal = ?,
            vat_total = ?,
            total = ?
          WHERE id = ?
            AND expense_id = ?
          `,
          [...itemValues, itemId, expenseId]
        );

        if ((updateResult as any).affectedRows === 0) {
          throw new Error(
            "An expense item was not found on this expense"
          );
        }
      } else {
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
            vat_rate,
            subtotal,
            vat_total,
            total
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          itemValues
        );
      }
    }

    const currentDate = new Date();

    await connection.query(
      `
      UPDATE expenses
      SET
        payee_id = ?,
        expense_number = ?,
        expense_date = ?,
        payment_method = ?,
        status = ?,
        subtotal = ?,
        vat_total = ?,
        total = ?,
        open_balance = ?,
        memo = ?,
        updated_at = ?
      WHERE id = ?
        AND business_id = ?
      `,
      [
        payeeId,
        body.expense_number,
        body.expense_date,
        body.payment_method ?? null,
        body.status,
        subtotal,
        vat,
        total,
        body.open_balance,
        body.memo ?? null,
        currentDate,
        expenseId,
        currentUser.business_id,
      ]
    );

    await connection.commit();
    transactionStarted = false;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (transactionStarted) {
      await connection.rollback();
    }

    console.error("Error updating expense:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update expense",
      },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}

