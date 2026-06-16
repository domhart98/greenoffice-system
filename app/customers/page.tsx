"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchCustomers = async () => {
        const response = await fetch(
            `/api/customers?search=${encodeURIComponent(search)}`
        );

        const data = await response.json();

        setCustomers(data);
    };

    fetchCustomers();
  }, [search]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        Customers
      </h1>
    
      <div className="mb-4">
        <input className="w-1/3 border rounded p-2"
            type="text"
            placeholder="Search customers name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <table className="w-full border mb-8">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Address</th>
            <th>Phone</th>
            <th>Email</th>
            <th>Notes</th>
            <th>Created At</th>
          </tr>
        </thead>

        <tbody>
          {customers.map((customer: any) => (
            <tr className="text-center" key={customer.id}>
              <td>
                <Link className="text-blue-600 underline" href={`/invoices/${customer.invoice_number}`}>
                    {customer.id}
                </Link>
              </td>
              <td>{customer.name}</td>
              <td>{customer.address}</td>
              <td>{customer.phone}</td>
              <td>{customer.email}</td>
              <td>{customer.notes}</td>
              <td>{customer.created_at}</td>
              <td>
                <a className="text-blue-600" href={`/customers/${customer.id}`}>
                    View
                </a>
                <button className="text-red-600"
                  onClick={async () => {
                    const confirmed = confirm(
                      "Delete this customer?"
                    );

                    if (!confirmed) return;

                    const response = await fetch(
                      `/api/customers/${customer.id}`,
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
                <a className="text-blue-600" href={`/customers/${customer.id}/edit`}>
                    Edit
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <a className="bg-green-300 rounded-full p-2 mt-8" href="/customers/new">Add New Customer</a>
    </div>
  );
}