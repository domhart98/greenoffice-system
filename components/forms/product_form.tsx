"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/types/product";

interface ProductFormProps {
  mode: "create" | "edit";
  product?: Product;
}

export default function ProductForm({
  mode,
  product,
}: ProductFormProps) {
  const router = useRouter();

  const [sku, setSku] = useState(product?.sku ?? "");
  const [name, setName] = useState(product?.name ?? "");
  const [price, setPrice] = useState(product?.price ?? 0);
  const [vatRate, setVatRate] = useState(product?.vat_rate ?? 17.5);
  const [isActive, setIsActive] = useState(
    product?.is_active ?? true
  );
  const [stockQuantity, setStockQuantity] = useState(product?.stock_quantity ?? 0)

  async function handleCreateProduct() {
    const response = await fetch(
      "/api/products/create",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sku,
          name,
          price,
          vat_rate: vatRate,
          is_active: isActive,
          stock_quantity: stockQuantity,
        }),
      }
    );

    const result = await response.json();

    if (result.success) {
      router.push("/products");
    }
  }

  async function handleUpdateProduct() {
    const response = await fetch(
      `/api/products/${product?.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sku,
          name,
          price,
          vat_rate: vatRate,
          is_active: isActive,
          stock_quantity: stockQuantity,
        }),
      }
    );
    
    const result = await response.json();

    if (result.success) {
      router.push("/products");
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="space-y-4">

        <div>
          <label className="block mb-1 font-medium">
            SKU
          </label>
          <input
            type="text"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            className="w-full border rounded p-2"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">
            Product Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded p-2"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">
            Price
          </label>
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) =>
              setPrice(Number(e.target.value))
            }
            className="w-full border rounded p-2"
          />
        </div>

        <div>
          <label className="block mb-2">
              Stock Quantity
          </label>

          <input
              className="border p-2 w-full"
              type="number"
              min="0"
              value={stockQuantity}
              onChange={(e) =>
                  setStockQuantity(
                      Number(e.target.value)
                  )
              }
          />
      </div>

        <div>
          <label className="block mb-1 font-medium">
            VAT Rate (%)
          </label>
          <input
            type="number"
            step="0.01"
            value={vatRate}
            onChange={(e) =>
              setVatRate(Number(e.target.value))
            }
            className="w-full border rounded p-2"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="is_active"
            type="checkbox"
            checked={isActive}
            onChange={(e) =>
              setIsActive(e.target.checked)
            }
          />

          <label htmlFor="is_active">
            Active Product
          </label>
        </div>

        <div className="pt-4">
          {mode === "create" && (
            <button
              type="button"
              onClick={handleCreateProduct}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              Create Product
            </button>
          )}

          {mode === "edit" && (
            <button
              type="button"
              onClick={handleUpdateProduct}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Update Product
            </button>
          )}
        </div>

      </div>
    </div>
  );
}