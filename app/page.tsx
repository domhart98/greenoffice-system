import { getCurrentUser } from "@/lib/auth";
import pool from "@/lib/db";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await getCurrentUser();

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

  const [recentInvoices]: any = await pool.query(`
    SELECT *
    FROM invoices
    ORDER BY id DESC
    LIMIT 10
  `);

  const [monthRevenue]: any = await pool.query(`
    SELECT
      COALESCE(SUM(total),0) AS total
    FROM invoices
    WHERE MONTH(invoice_date) = MONTH(CURDATE())
    AND YEAR(invoice_date) = YEAR(CURDATE())
  `);

  const [yearRevenue]: any = await pool.query(`
    SELECT
      COALESCE(SUM(total),0) AS total
    FROM invoices
    WHERE YEAR(invoice_date) = YEAR(CURDATE())
  `);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">
        Dashboard
      </h1>
      <h1 className="text-3xl font-bold">
        Welcome back, {user.username}
      </h1>
      <p className="text-gray-500">
        {new Date().toLocaleDateString()}
      </p>

      {/* Cards */}

      <div className="grid grid-cols-3 gap-4 mb-8">

        <div className="border rounded p-4">
          <h2>Customers</h2>
          <p className="text-3xl">
            {customerRows[0].total}
          </p>
        </div>

        <div className="border rounded p-4">
          <h2>Products</h2>
          <p className="text-3xl">
            {productRows[0].total}
          </p>
        </div>

        <div className="border rounded p-4">
          <h2>Invoices</h2>
          <p className="text-3xl">
            {invoiceRows[0].total}
          </p>
        </div>

      </div>

      {/* Recent Invoices */}

      <h2 className="text-xl font-bold mb-4">
        Recent Invoices
      </h2>

      <table className="w-full border">
        <thead>
          <tr>
            <th>Invoice</th>
            <th>Customer</th>
            <th>Total</th>
            <th>Created On</th>
          </tr>
        </thead>

        <tbody>
          {recentInvoices.map((invoice: any) => (
            <tr className="text-center" key={invoice.invoice_number}>
              <td>
                <Link className="text-blue-600 underline" href={`/invoices/${invoice.invoice_number}`}>
                  {invoice.invoice_number}
                </Link>
              </td>
              <td>{invoice.customer_name}</td>
              <td>${invoice.total}</td>
              <td>{new Date(invoice.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Total Revenues */}
      <div className="border rounded p-4">
        <h2>Revenue This Month</h2>
        <p className="text-3xl">
          ${monthRevenue[0].total}
        </p>
      </div>

      <div className="border rounded p-4">
        <h2>Revenue This Year</h2>
        <p className="text-3xl">
          ${yearRevenue[0].total}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="border rounded p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">
          Quick Actions
        </h2>

        <div className="flex gap-4">
          <Link
            href="/invoices/new"
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            New Invoice
          </Link>

          <Link
            href="/customers/new"
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            New Customer
          </Link>

          <Link
            href="/products/new"
            className="bg-purple-600 text-white px-4 py-2 rounded"
          >
            New Product
          </Link>
        </div>
      </div>
    </div>
  );
}
