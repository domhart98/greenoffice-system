"use client";

import ProductForm from "@/components/forms/product_form";

export default function NewProductPage() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-6">
        Create Products
      </h1>

      <ProductForm mode={"create"}/>
    </main>
  );
}