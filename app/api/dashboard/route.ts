import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireApiAuth } from "@/lib/auth";

export async function GET() {
  const auth = await requireApiAuth();

  if (auth.response) {
    return auth.response;
  }

  const currentUser = auth.user;
  const businessId = currentUser.business_id;

  const connection = await pool.getConnection();

  try {
    // Accounts receivable
    const [accountsReceivable]: any = await connection.query(
      `
      SELECT COALESCE(SUM(total), 0) AS total
      FROM invoices
      WHERE status = 'SENT'
        AND business_id = ?
      `,
      [businessId]
    );

    // Customer balances
    const [customerBalances]: any = await connection.query(
      `
      SELECT
        customer_name,
        SUM(total) AS balance
      FROM invoices
      WHERE status = 'SENT'
        AND business_id = ?
      GROUP BY customer_name
      ORDER BY balance DESC
      `,
      [businessId]
    );

    // Outstanding invoices
    const [outstandingInvoices]: any = await connection.query(
      `
      SELECT
        invoice_number,
        customer_name,
        total,
        due_date
      FROM invoices
      WHERE status IN ('UNPAID', 'PARTIAL')
        AND business_id = ?
      ORDER BY due_date ASC
      LIMIT 10
      `,
      [businessId]
    );

    // Overdue invoice count
    const [overdueInvoices]: any = await connection.query(
      `
      SELECT COUNT(*) AS total
      FROM invoices
      WHERE status = 'SENT'
        AND due_date < CURDATE()
        AND business_id = ?
      `,
      [businessId]
    );

    // Overdue amount
    const [overdueAmount]: any = await connection.query(
      `
      SELECT COALESCE(SUM(total), 0) AS total
      FROM invoices
      WHERE status = 'SENT'
        AND DATE_ADD(invoice_date, INTERVAL 30 DAY) < CURDATE()
        AND business_id = ?
      `,
      [businessId]
    );

    // Dashboard KPIs
    const [kpisResult]: any = await connection.query(
      `
      SELECT
        (
          SELECT COALESCE(SUM(total), 0)
          FROM invoices
          WHERE business_id = ?
        ) AS revenue,
        (
          SELECT COUNT(*)
          FROM invoices
          WHERE business_id = ?
        ) AS invoices,
        (
          SELECT COUNT(*)
          FROM customers
          WHERE business_id = ?
        ) AS customers,
        (
          SELECT COUNT(*)
          FROM products
          WHERE business_id = ?
        ) AS products
      `,
      [businessId, businessId, businessId, businessId]
    );

    // Revenue by month
    const [revenueByMonth]: any = await connection.query(
      `
      SELECT
        DATE_FORMAT(invoice_date, '%b') AS month,
        SUM(total) AS revenue
      FROM invoices
      WHERE business_id = ?
      GROUP BY month
      ORDER BY MIN(invoice_date)
      `,
      [businessId]
    );

    // Top products, limited to invoices belonging to this business
    const [topProducts]: any = await connection.query(
      `
      SELECT
        ii.product_name AS product,
        SUM(ii.total) AS revenue
      FROM invoice_items ii
      INNER JOIN invoices i
        ON i.id = ii.invoice_id
      WHERE i.business_id = ?
      GROUP BY ii.product_name
      ORDER BY revenue DESC
      LIMIT 5
      `,
      [businessId]
    );

    // Top customers
    const [topCustomers]: any = await connection.query(
      `
      SELECT
        customer_name AS customer,
        SUM(total) AS total
      FROM invoices
      WHERE business_id = ?
      GROUP BY customer_name
      ORDER BY total DESC
      LIMIT 5
      `,
      [businessId]
    );

    // Recent invoices
    const [recentInvoices]: any = await connection.query(
      `
      SELECT
        id,
        invoice_number,
        customer_name,
        total,
        invoice_date AS date
      FROM invoices
      WHERE business_id = ?
      ORDER BY created_at DESC
      LIMIT 5
      `,
      [businessId]
    );

    // Revenue by invoice status
    const [revenueByStatus]: any = await connection.query(
      `
      SELECT
        status,
        SUM(total) AS total
      FROM invoices
      WHERE business_id = ?
      GROUP BY status
      `,
      [businessId]
    );

    const revenueByStatusFormatted = revenueByStatus.map(
      (row: any) => ({
        ...row,
        total: Number(row.total),
      })
    );

    // Customer count
    const [customerRows]: any = await connection.query(
      `
      SELECT COUNT(*) AS total
      FROM customers
      WHERE business_id = ?
      `,
      [businessId]
    );

    // Product count
    const [productRows]: any = await connection.query(
      `
      SELECT COUNT(*) AS total
      FROM products
      WHERE business_id = ?
      `,
      [businessId]
    );

    // Invoice count
    const [invoiceRows]: any = await connection.query(
      `
      SELECT COUNT(*) AS total
      FROM invoices
      WHERE business_id = ?
      `,
      [businessId]
    );

    // Current month's revenue
    const [monthlyRevenue]: any = await connection.query(
      `
      SELECT COALESCE(SUM(total), 0) AS total
      FROM invoices
      WHERE MONTH(invoice_date) = MONTH(CURDATE())
        AND YEAR(invoice_date) = YEAR(CURDATE())
        AND business_id = ?
      `,
      [businessId]
    );

    // Current year's revenue
    const [yearlyRevenue]: any = await connection.query(
      `
      SELECT COALESCE(SUM(total), 0) AS total
      FROM invoices
      WHERE YEAR(invoice_date) = YEAR(CURDATE())
        AND business_id = ?
      `,
      [businessId]
    );

    // Low-stock product count
    const [lowStockCount]: any = await connection.query(
      `
      SELECT COUNT(*) AS total
      FROM products
      WHERE stock_quantity <= 5
        AND stock_quantity > 0
        AND business_id = ?
      `,
      [businessId]
    );

    // Out-of-stock product count
    const [outOfStockCount]: any = await connection.query(
      `
      SELECT COUNT(*) AS total
      FROM products
      WHERE stock_quantity = 0
        AND business_id = ?
      `,
      [businessId]
    );

    // Low-stock products
    const [lowStockProducts]: any = await connection.query(
      `
      SELECT
        id,
        sku,
        name,
        stock_quantity
      FROM products
      WHERE stock_quantity <= 5
        AND business_id = ?
      ORDER BY stock_quantity ASC
      LIMIT 10
      `,
      [businessId]
    );

    return NextResponse.json({
      accountsReceivable: accountsReceivable[0].total,
      customerBalances,
      outstandingInvoices,
      overdueInvoices: overdueInvoices[0].total,
      overdueAmount: overdueAmount[0].total,
      lowStockCount: lowStockCount[0].total,
      outOfStockCount: outOfStockCount[0].total,

      customerCount: customerRows[0].total,
      productCount: productRows[0].total,
      invoiceCount: invoiceRows[0].total,

      monthlyRevenue: monthlyRevenue[0].total,
      yearlyRevenue: yearlyRevenue[0].total,

      revenueByMonth,
      topProducts,
      topCustomers,
      recentInvoices,
      revenueByStatus,
      revenueByStatusFormatted,
      lowStockProducts,

      kpis: kpisResult[0],
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);

    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}