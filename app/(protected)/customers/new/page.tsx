"use client";

import CustomerForm from "@/components/forms/customer_form";

export default function NewCustomerPage() {
  return (
    <main className="min-h-screen p-8 bg-white">
      <h1 className="text-3xl font-bold mb-6">
        Create Customer
      </h1>

      <div className="bg-white">
        <CustomerForm mode="create"/>
      </div>
      
    </main>
  );
}