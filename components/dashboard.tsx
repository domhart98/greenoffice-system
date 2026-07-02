"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import KpiCard from "@/components/kpi_card";
import RevenueChart from "./charts/revenue_chart";
import TopProductsChart from "./charts/top_products_chart";
import RevenueStatusChart from "./charts/revenue_status_chart";

export default function Dashboard(){
    const [data, setData] = useState<any>(null);
    
    useEffect(() => {
        fetch("/api/dashboard")
        .then((res) => res.json())
        .then(setData);
    }, []);

    if (!data) {
        return <div className="p-6">Loading dashboard...</div>;
    }

    console.log(data);

    const { kpis } = data;
    
    return(
        <div>
            <h1 className="text-3xl font-bold mb-8">
                Dashboard
            </h1>
            <h1 className="text-3xl font-bold">
                Welcome back
            </h1>
            <p className="text-gray-500">
                {new Date().toLocaleDateString()}
            </p>

            {/* Cards */}

            <div className="grid grid-cols-3 gap-4 mb-8">

                <div className="border rounded p-4">
                <h2>Customers</h2>
                <p className="text-3xl">
                    {data.customerCount}
                </p>
                </div>

                <div className="border rounded p-4">
                <h2>Products</h2>
                <p className="text-3xl">
                    {data.productCount}
                </p>
                </div>

                <div className="border rounded p-4">
                <h2>Invoices</h2>
                <p className="text-3xl">
                    {data.invoiceCount}
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
                {data.recentInvoices.map((invoice: any) => (
                    <tr className="text-center" key={invoice.invoice_number}>
                    <td>
                        <Link className="text-blue-600 underline" href={`/invoices/${invoice.invoice_number}`}>
                        {invoice.invoice_number}
                        </Link>
                    </td>
                    <td>{invoice.customer_name}</td>
                    <td>${invoice.total}</td>
                    <td>{new Date(invoice.date).toLocaleDateString()}</td>
                    </tr>
                ))}
                </tbody>
            </table>

            {/* Total Revenues */}
            <RevenueChart data={data.revenueByMonth}/>
            <div className="border rounded p-4">
                <h2>Revenue This Month</h2>
                <p className="text-3xl">
                ${data.monthlyRevenue}
                </p>
            </div>

            <div className="border rounded p-4">
                <h2>Revenue This Year</h2>
                <p className="text-3xl">
                ${data.yearlyRevenue}
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

            {/* MAIN GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div className="bg-white p-4 rounded-xl shadow">
                    <RevenueStatusChart data={data.revenueByStatus}/>
                </div>

                <div className="bg-white p-4 rounded-xl shadow">
                    <TopProductsChart data={data.topProducts}/>
                </div>

            </div>

            {/* TABLES */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">


            </div>
            <div className="bg-white p-6 rounded-xl shadow">
                <h2 className="text-xl font-bold mb-4">
                    Low Stock Alerts
                </h2>

                {data.lowStockProducts.length === 0 ? (
                    <p className="text-green-600">
                        No low stock alerts.
                    </p>
                ) : (
                    <ul className="space-y-2">
                        {data.lowStockProducts.map((product: any) => (
                            <li
                                key={product.id}
                                className="flex justify-between border-b pb-2"
                            >
                                <span>{product.name}</span>

                                <span className="text-red-600 font-bold">
                                    {product.stock_quantity} left
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <div>
                <KpiCard
                title="Accounts Receivable"
                value={`$${data.accountsReceivable}`}
                />

                <KpiCard
                    title="Overdue Invoices"
                    value={data.overdueInvoices}
                />

                <KpiCard
                    title="Overdue Amount"
                    value={`$${data.overdueAmount}`}
                />
                <KpiCard
                    title="Low Stock"
                    value={data.lowStockCount}
                />

                <KpiCard
                    title="Out of Stock"
                    value={data.outOfStockCount}
                />
            </div>
            
            <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-xl font-bold mb-4">
                    Outstanding Invoices
                </h2>

                <table className="w-full">
                    <thead>
                        <tr>
                            <th>Invoice</th>
                            <th>Customer</th>
                            <th>Due Date</th>
                            <th>Total</th>
                        </tr>
                    </thead>

                    <tbody>
                        {data.outstandingInvoices.map((invoice: any) => (
                            <tr
                                key={invoice.invoice_number}
                                className="border-t"
                            >
                                <td className="text-center">
                                    <Link
                                        href={`/invoices/${invoice.invoice_number}`}
                                        className="text-blue-600 underline"
                                    >
                                        {invoice.invoice_number}
                                    </Link>
                                </td>

                                <td className="text-center">
                                    {invoice.customer_name}
                                </td>

                                <td className="text-center">
                                    {new Date(invoice.due_date).toLocaleDateString()}
                                </td>

                                <td className="text-center">
                                    ${Number(invoice.total).toFixed(2)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}