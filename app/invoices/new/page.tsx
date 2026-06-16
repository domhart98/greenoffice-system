"use client";

import InvoiceForm from "@/components/invoice_form";

export default function NewInvoicePage() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-6">
        Create Invoice
      </h1>

      <InvoiceForm />
    </main>
  );
}