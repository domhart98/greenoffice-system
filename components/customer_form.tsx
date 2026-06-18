"use client";

import { useState, useEffect } from "react";
import { Customer } from "@/types/customer";
import { useRouter } from "next/navigation";

interface CustomerFormProps {
  mode: "create" | "edit";
  customer?: Customer;
}

export default function CustomerForm({mode, customer,}: CustomerFormProps) {
  const router = useRouter();

  const [name, setName] = useState(customer?.name ?? "");
  const [address, setAddress] = useState(customer?.address ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [email, setEmail] = useState(customer?.email ?? "");
  const [dateCreated, setDateCreated] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState(customer?.notes ?? "");

  async function handleCreateCustomer() {
    const response = await fetch("/api/customers/create",
      {
        method: "POST",

        headers: {
            "Content-Type":"application/json",
        },

        body: JSON.stringify({
          name,
          address,
          phone,
          email,
          notes
        }),
      }
    );

    const result = await response.json();

    if (result.success) {
      router.push("/customers");
    }
  };

  async function handleUpdateCustomer(){
    const response = await fetch(`/api/customers/${customer?.id}`,
      {
        method: "PUT",

        headers: {
            "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
            name,
            address,
            phone,
            email,
            notes
        }),
      }
    );
    
    const result = await response.json();

    if (result.success) {
      router.push("/customers");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div>
            <label className="block mb-2">Name</label>
            <input className="border p-2 w-full" type="text"
                   value={name}
                   onChange={(e) => setName(e.target.value)}
            />
        </div>

        <div>
            <label className="block mb-2">Address</label>
            <textarea className="border p-2 w-full"
                   value={address}
                   onChange={(e) => setAddress(e.target.value)}
            />
        </div>
        <div>
          <label className="block mb-2">Phone</label>
          <input className="border p-2 w-full" type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div>
            <label className="block mb-2">Email</label>
            <input className="border p-2 w-full" type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
        </div>
        <div>
            <label className="block mb-2">Notes</label>
            <textarea className="border p-2 w-full"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
            />
        </div>
      </div>
      <div className="pt-4">
          {mode === "create" && (
            <button
              type="button"
              onClick={handleCreateCustomer}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              Create Customer
            </button>
          )}

          {mode === "edit" && (
            <button
              type="button"
              onClick={handleUpdateCustomer}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Update Customer
            </button>
          )}
        </div>
    </div>
  );
}