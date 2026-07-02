"use client";

import CustomerForm from "@/components/forms/customer_form";

export default function NewCustomerPage() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-6">
        Create Invoice
      </h1>

      <CustomerForm mode="create"/>
    </main>
  );
}