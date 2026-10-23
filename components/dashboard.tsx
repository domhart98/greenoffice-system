"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import KpiCard from "@/components/kpi_card";
import RevenueChart from "./charts/revenue_chart";
import TopProductsChart from "./charts/top_products_chart";
import RevenueStatusChart from "./charts/revenue_status_chart";
import LoadingSpinner from "./loading_spinner";
import { getCurrentUser } from "@/lib/auth";
import { User } from "@/types/user";
import ProfitLossWidget from "./widgets/profit_loss_widget";
import CashFlowWidget from "./widgets/cashflow_widget";
import InvoicesWidget from "./widgets/invoices_widget";
import SalesWidget from "./widgets/sales_widget";
import ExpensesWidget from "./widgets/expenses_widget";
import AccountsReceivableWidget from "./widgets/accounts_receivable_widget";

export default function Dashboard({
    user,
}: {
    user: User;
}) {
    const [data, setData] = useState<any>(null);

    console.log("User: ", user.username);
    
    useEffect(() => {
        fetch("/api/dashboard")
        .then((res) => res.json())
        .then(setData);
    }, []);

    if (!data) {
        return <LoadingSpinner/>;
    }

    console.log("API Data: ", data);

    const { kpis } = data;
    
    return(
      <div>
        <h1>
          Welcome back, <span>{user.username}</span>
        </h1>
        <p className="mb-8 text-lg text-slate-500">
          Here's an overview of your business.
        </p>

        {/* Widgets */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 mb-8">
          <ProfitLossWidget/>
          <CashFlowWidget/>
          <InvoicesWidget/>
          <SalesWidget/>
          <ExpensesWidget/>
          <AccountsReceivableWidget/>
        </div>

        {/* TABLES */}
         <div className="bg-white rounded-xl shadow p-6 my-8">
            <h2 className="text-xl font-bold mb-6">
                Outstanding Invoices
            </h2>

            <table className="w-full border-collapse">
                <thead>
                    <tr>
                        <th>Invoice # </th>
                        <th>Customer</th>
                        <th>Due Date</th>
                        <th>Total</th>
                    </tr>
                </thead>

                <tbody>
                    {data.outstandingInvoices.map((invoice: any) => (
                        <tr
                            key={invoice.invoice_number}
                            className="border-b border-slate-200 last:border-b-0"
                        >
                            <td className="px-3 py-4 text-center">
                                <Link
                                    href={`/invoices/${invoice.invoice_number}`}
                                    className="text-blue-600 hover:text-blue-800 hover:underline"
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

        <div className="bg-white p-6 rounded-xl shadow my-8">
            <h2 className="text-xl font-bold mb-6">
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
                            className="flex justify-between border-b border-slate-200 last:border-b-0"
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

        {/* KPIs */}
        <div className="mb-8 grid col-1 gap-4">
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
    </div>
    )
}