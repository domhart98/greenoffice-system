"use client";

import { useState, useEffect } from "react";
import { Customer } from "@/types/customer";
import { usePathname } from "next/navigation";


export default function CustomerForm({customer,}: {customer?: Customer}) {

  const pathname = usePathname();
  const [id, setId] = useState(customer?.id ?? null);
  const [name, setName] = useState(customer?.name ?? "");
  const [address, setAddress] = useState(customer?.address ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [email, setEmail] = useState(customer?.email ?? "");
  const [dateCreated, setDateCreated] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState(customer?.notes ?? "");
  const isNew = pathname === "/customers/new";
  const isEdit = pathname.includes("/edit");

  const handleAddCustomer = async () => {
    const customerData = {
        id,
        name,
        address,
        phone,
        email,
        notes,
    };

    console.log(customerData);

    const response = await fetch(
        "/api/customers/create",
        {
        method: "POST",

        headers: {
            "Content-Type":
            "application/json",
        },

        body: JSON.stringify(customerData),
        }
    );

    const result = await response.json();

    if (!result.success) {
        alert("Failed to save invoice");
        return;
    }
  };

  const handleUpdateCustomer = async () => {
    const customerData = {
        id,
        name,
        address,
        phone,
        email,
        notes,
    };

    console.log(customerData);

    const response = await fetch(
      `/api/customers/${customerData.id}`,
      {
      method: "PUT",

      headers: {
          "Content-Type":
          "application/json",
      },

      body: JSON.stringify(customerData),
      }
    );
    
    const result = await response.json();

    if (!result.success) {
        alert("Failed to save invoice");
        return;
    }
    
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div>
            <label className="block mb-2">ID</label>
            <input className="border p-2 w-full" type="number"
                   value={id}
                   onChange={(e) => setId(e.target.value)}
                   disable="true"
            />
        </div>
        <div>
            <label className="block mb-2">Name</label>
            <input className="border p-2 w-full" type="text"
                   value={name}
                   onChange={(e) => setName(e.target.value)}
            />
        </div>

        <div>
            <label className="block mb-2">Address</label>
            <input className="border p-2 w-full" type="text"
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
            <label className="block mb-2">Created On</label>
            <input className="border p-2 w-full" type="date"
                        value={dateCreated}
                        onChange={(e) => setDateCreated(e.target.value)}
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
      {isNew && (<button className="bg-green-600 text-white px-4 py-2 rounded-full" type="button"
              onClick={handleAddCustomer}>
        Add Customer
      </button>)}
      {isEdit && (<button className="bg-green-600 text-white px-4 py-2 rounded-full" type="button"
              onClick={handleUpdateCustomer}>
        Update Customer
      </button>)}
    </div>
  );
}