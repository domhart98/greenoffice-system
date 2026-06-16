"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchInvoices = async () => {
        const response = await fetch(
            `/api/invoices?search=${encodeURIComponent(search)}`
        );

        const data = await response.json();

        setInvoices(data);
    };

    fetchInvoices();
  }, [search]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        Invoices
      </h1>
    
      <div className="mb-4">
        <input className="w-1/3 border rounded p-2"
            type="text"
            placeholder="Search invoice number or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <table className="w-full border">
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Customer</th>
            <th>Date</th>
            <th>Total</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {invoices.map((invoice: any) => (
            <tr className="text-center" key={invoice.id}>
              <td>
                <Link className="text-blue-600 underline" href={`/invoices/${invoice.invoice_number}`}>
                    {invoice.invoice_number}
                </Link>
              </td>
              <td>{invoice.customer_name}</td>
              <td>{invoice.invoice_date}</td>
              <td>${invoice.total}</td>
              <td>
                <a className="text-blue-600" href={`/invoices/${invoice.invoice_number}`}>
                    View
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}