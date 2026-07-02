"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import InvoiceStatusBadge from "@/components/invoice_status_badge";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [sort, setSort] = useState("newest");

  //Set timer on search value change, to give user time to input more characters before searching
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    const fetchInvoices = async () => {
      const response = await fetch(
        `/api/invoices?search=${encodeURIComponent(debouncedSearch)}&status=${status}&sort=${sort}`
      );

      const data = await response.json();

      setInvoices(data);
    };

    fetchInvoices();
  }, [debouncedSearch, status, sort]);

  if (!invoices) {
    return <div className="p-6">Loading Invoices...</div>;
  }

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

        <select
          className="border rounded p-2"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="ALL">All</option>
          <option value="DRAFT">Draft</option>
          <option value="SENT">Sent</option>
          <option value="PAID">Paid</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <select
        value={sort}
        onChange={(e) => setSort(e.target.value)}
      >
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
        <option value="highest">Highest Total</option>
        <option value="lowest">Lowest Total</option>
      </select>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="border rounded p-4">
          <h2>Total Invoices</h2>
          <p className="text-2xl">{invoices.length}</p>
        </div>
        <div className="border rounded p-4">
          <h2>Draft</h2>
          <p className="text-2xl">
            {
              invoices.filter(
                (i: any) => i.status === "DRAFT"
              ).length
            }
          </p>
        </div>
        <div className="border rounded p-4">
          <h2>Sent</h2>
          <p className="text-2xl">
            {
              invoices.filter(
                (i: any) => i.status === "SENT"
              ).length
            }
          </p>
        </div>
        <div className="border rounded p-4">
          <h2>Paid</h2>
          <p className="text-2xl">
            {
              invoices.filter(
                (i: any) => i.status === "PAID"
              ).length
            }
          </p>
        </div>
      </div>

      <table className="w-full border mb-8">
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Customer</th>
            <th>Status</th>
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
              <td><InvoiceStatusBadge status={invoice.status}/></td>
              <td>{new Date(invoice.invoice_date).toLocaleDateString()}</td>
              <td>${invoice.total}</td>
              <td className="">
                <div className="flex justify-center gap-2">
                  <Link className="text-blue-600" href={`/invoices/${invoice.invoice_number}`}>
                      View
                  </Link>
                  {invoice.status !== "PAID" &&
                    invoice.status !== "CANCELLED" && (
                    <button className="text-red-600"
                      onClick={async () => {
                        const confirmed = confirm(
                          "Delete this invoice?"
                        );

                        if (!confirmed) return;

                        const response = await fetch(
                          `/api/invoices/${invoice.invoice_number}`,
                          {
                            method: "DELETE",
                          }
                        );

                        const result = await response.json();

                        console.log(result);

                        if (result.success) {
                          window.location.reload();
                        }
                      }}
                    >
                      Delete
                    </button>
                  )}
                  {invoice.status === "DRAFT" && (
                      <Link
                        className="text-blue-600"
                        href={`/invoices/${invoice.invoice_number}/edit`}
                      >
                        Edit
                      </Link>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Link className="bg-green-300 rounded-full p-2 mt-8" href="/invoices/new">Add New Invoices</Link>
    </div>
  );
}