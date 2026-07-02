import pool from "@/lib/db";

export async function GET() {
  const connection = await pool.getConnection();

  try{
    const [accountsReceivable]: any = await connection.query(`
      SELECT
        COALESCE(SUM(total), 0) AS total
      FROM invoices
      WHERE status = 'SENT'
    `);

    const [customerBalances]: any = await connection.query(`
      SELECT
        customer_name,
        SUM(total) AS balance
      FROM invoices
      WHERE status = 'SENT'
      GROUP BY customer_name
      ORDER BY balance DESC
    `);

    const [outstandingInvoices]: any = await connection.query(`
      SELECT
        invoice_number,
        customer_name,
        total,
        due_date
      FROM invoices
      WHERE status = 'SENT'
      ORDER BY due_date ASC
      LIMIT 10
    `);

    const [overdueInvoices]: any = await connection.query(`
      SELECT COUNT(*) AS total
      FROM invoices
      WHERE status = 'SENT'
      AND due_date < CURDATE()
    `);

    const [overdueAmount]: any = await connection.query(`
      SELECT
        COALESCE(SUM(total),0) AS total
      FROM invoices
      WHERE status = 'SENT'
      AND DATE_ADD(invoice_date, INTERVAL 30 DAY) < CURDATE()
    `);

    const [kpisResult] = await connection.query(`
      SELECT
        (SELECT COALESCE(SUM(total),0) FROM invoices) AS revenue,
        (SELECT COUNT(*) FROM invoices) AS invoices,
        (SELECT COUNT(*) FROM customers) AS customers,
        (SELECT COUNT(*) FROM products) AS products
    `);

    const [revenueByMonth] = await connection.query(`
      SELECT
        DATE_FORMAT(invoice_date, '%b') AS month,
        SUM(total) AS revenue
      FROM invoices
      GROUP BY month
      ORDER BY MIN(invoice_date)
    `);

    const [topProducts] = await connection.query(`
      SELECT
        product_name AS product,
        SUM(total) AS revenue
      FROM invoice_items
      GROUP BY product_name
      ORDER BY revenue DESC
      LIMIT 5
    `);

    const [topCustomers] = await connection.query(`
      SELECT
        customer_name AS customer,
        SUM(total) AS total
      FROM invoices
      GROUP BY customer_name
      ORDER BY total DESC
      LIMIT 5
    `);
 
    const [recentInvoices] = await connection.query(`
      SELECT
        id,
        invoice_number,
        customer_name,
        total,
        invoice_date AS date
      FROM invoices
      ORDER BY created_at DESC
      LIMIT 5
    `);

   
    const [revenueByStatus] = await connection.query(`
      SELECT
          status,
          SUM(total) AS total
      FROM invoices
      GROUP BY status
    `);

    const revenueByStatusFormatted = (revenueByStatus as any[]).map(
      (row) => ({
        ...row,
        total: Number(row.total),
      })
    );

    const [customerRows]: any = await pool.query(`
        SELECT COUNT(*) AS total
        FROM customers
    `);

    const [productRows]: any = await pool.query(`
        SELECT COUNT(*) AS total
        FROM products
    `);

    const [invoiceRows]: any = await pool.query(`
        SELECT COUNT(*) AS total
        FROM invoices
    `);

    const [monthlyRevenue]: any = await pool.query(`
        SELECT
        COALESCE(SUM(total),0) AS total
        FROM invoices
        WHERE MONTH(invoice_date) = MONTH(CURDATE())
        AND YEAR(invoice_date) = YEAR(CURDATE())
    `);

    const [yearlyRevenue]: any = await pool.query(`
        SELECT
        COALESCE(SUM(total),0) AS total
        FROM invoices
        WHERE YEAR(invoice_date) = YEAR(CURDATE())
    `);

    const [lowStockCount]: any = await connection.query(`
        SELECT COUNT(*) AS total
        FROM products
        WHERE stock_quantity <= 5
        AND stock_quantity > 0
    `);

    const [outOfStockCount]: any = await connection.query(`
        SELECT COUNT(*) AS total
        FROM products
        WHERE stock_quantity = 0
    `);

    const [lowStockProducts] = await connection.query(`
        SELECT
            id,
            sku,
            name,
            stock_quantity
        FROM products
        WHERE stock_quantity <= 5
        ORDER BY stock_quantity ASC
        LIMIT 10
    `);

    return Response.json({
      accountsReceivable: accountsReceivable[0].total,
      customerBalances: customerBalances,
      outstandingInvoices: outstandingInvoices,
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

      kpis: (kpisResult as any)[0],
    });
  } finally {
        connection.release();
  }
}