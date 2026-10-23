"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/types/product";

interface ProductFormProps {
  mode: "create" | "edit" | "view";
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
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [stockQuantity, setStockQuantity] = useState(product?.stock_quantity ?? 0);
  const [type, setType] = useState(product?.type ?? "");
  const [category, setCategory] = useState(product?.category ?? "");
  const [cost, setCost] = useState(product?.cost ?? 0);
  const [salesDescription, setSalesDescription] = useState(product?.sales_description ?? "");
  const [purchaseDescription, setPurchaseDescription] = useState(product?.purchase_description ?? "");
  const [reorderPoint, setReorderPoint] = useState(product?.reorder_point ?? 0);
  const [incomeAccount, setIncomeAccount] = useState(product?.income_account ?? "");
  const [expenseAccount, setExpenseAccount] = useState(product?.expense_account ?? "");
  const [inventoryAccount, setInventoryAccount] = useState(product?.inventory_account ?? "");
  const isViewMode = mode === "view";
  const isCreateMode = mode === "create";
  const isEditMode = mode === "edit";

  async function handleCreateProduct() {
    const response = await fetch(
      "/api/products",
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
          type,
          category,
          cost,
          sales_description: salesDescription,
          pruchase_description: purchaseDescription,
          reorder_point: reorderPoint,
          income_account: incomeAccount,
          expense_account: expenseAccount,
          inventory_account: inventoryAccount,
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
          type,
          category,
          cost,
          sales_description: salesDescription,
          pruchase_description: purchaseDescription,
          reorder_point: reorderPoint,
          income_account: incomeAccount,
          expense_account: expenseAccount,
          inventory_account: inventoryAccount,
        }),
      }
    );
    
    const result = await response.json();

    if (result.success) {
      router.push("/products");
    }
  }

  return (
    <div className="">
      <div className="form-card">

        {/* Product Information */}
        <section className="form-section">
          <div className="mb-6">
            <h2 className="form-section-title">
              Product Information
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-6">

            {/* Product Name */}
            <div>
              <label className="form-label">
                Product Name <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                placeholder="e.g. Barbados Playing Cards"
                disabled={isViewMode}
              />
            </div>

            {/* SKU */}
            <div>
              <label className="form-label">
                SKU
              </label>

              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="form-input disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                placeholder="e.g. BPC-001"
                disabled={isViewMode}
              />
            </div>

            {/* Type */}
            <div>
              <label className="form-label">
                Type <span className="text-red-500">*</span>
              </label>

              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="form-select disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                disabled={isViewMode}
              >
                <option value="">Select type</option>
                <option value="PRODUCT">Product</option>
                <option value="SERVICE">Service</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="form-label">
                Category
              </label>

              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="form-input disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                placeholder="e.g. Souvenirs"
                disabled={isViewMode}
              />
            </div>

          </div>
        </section>

        <div className="border-t border-slate-200" />

        {/* Pricing & Inventory */}
        <section className="form-section">
          <div className="mb-6">
            <h2 className="form-section-title">
              Pricing & Inventory
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-6">

            {/* Selling Price */}
            <div>
              <label className="form-label">
                Selling Price <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                  $
                </span>

                <input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="form-input disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 pl-7"
                  min="0"
                  disabled={isViewMode}
                />
              </div>
            </div>

            {/* Cost */}
            <div>
              <label className="form-label">
                Cost Price
              </label>

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                  $
                </span>

                <input
                  type="number"
                  step="0.01"
                  value={cost}
                  onChange={(e) => setCost(Number(e.target.value))}
                  className="form-input disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 pl-7"
                  min="0"
                  disabled={isViewMode}
                />
              </div>
            </div>

            {/* VAT Rate */}
            <div>
              <label className="form-label">
                VAT Rate
              </label>

              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={vatRate}
                  onChange={(e) => setVatRate(Number(e.target.value))}
                  className="form-input disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 pr-8"
                  min="0"
                  max="100"
                  disabled={isViewMode}
                />

                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                  %
                </span>
              </div>
            </div>

            {/* Stock Quantity */}
            <div>
              <label className="form-label">
                Stock Quantity
              </label>

              <input
                type="number"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(Number(e.target.value))}
                className="form-input disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                min="0"
                step="1"
                disabled={isViewMode}
              />
            </div>

            {/* Reorder Point */}
            <div>
              <label className="form-label">
                Reorder Point
              </label>

              <input
                type="number"
                value={reorderPoint}
                onChange={(e) => setReorderPoint(Number(e.target.value))}
                className="form-input disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                min="0"
                step="1"
                disabled={isViewMode}
              />
            </div>

            {/* Active */}
            <div className="flex items-end">
              <label className="flex h-10 cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  disabled={isViewMode}
                />

                <span className="text-sm font-medium text-slate-700">
                  Active Product
                </span>
              </label>
            </div>

          </div>
        </section>

        <div className="border-t border-slate-200" />

        {/* Descriptions & Accounting */}
        <section className="form-section">
          <div className="mb-6">
            <h2 className="form-section-title">
              Descriptions & Accounting
            </h2>
          </div>

          <div className="space-y-6">

            {/* Sales Description */}
            <div>
              <label className="form-label">
                Sales Description
              </label>

              <textarea
                value={salesDescription}
                onChange={(e) => setSalesDescription(e.target.value)}
                className="form-textarea disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                placeholder="Description shown on sales documents..."
                disabled={isViewMode}
              />
            </div>

            {/* Purchase Description */}
            <div>
              <label className="form-label">
                Purchase Description
              </label>

              <textarea
                value={purchaseDescription}
                onChange={(e) => setPurchaseDescription(e.target.value)}
                className="form-textarea disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                placeholder="Description used when purchasing this product..."
                disabled={isViewMode}
              />
            </div>

            {/* Accounting */}
            <div className="grid grid-cols-3 gap-6">

              <div>
                <label className="form-label">
                  Income Account
                </label>

                <input
                  type="text"
                  value={incomeAccount}
                  onChange={(e) => setIncomeAccount(e.target.value)}
                  className="form-input disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                  placeholder="e.g. Sales"
                  disabled={isViewMode}
                />
              </div>

              <div>
                <label className="form-label">
                  Expense Account
                </label>

                <input
                  type="text"
                  value={expenseAccount}
                  onChange={(e) => setExpenseAccount(e.target.value)}
                  className="form-input disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                  placeholder="e.g. Cost of Goods Sold"
                  disabled={isViewMode}
                />
              </div>

              <div>
                <label className="form-label">
                  Inventory Account
                </label>

                <input
                  type="text"
                  value={inventoryAccount}
                  onChange={(e) => setInventoryAccount(e.target.value)}
                  className="form-input disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                  placeholder="e.g. Inventory Asset"
                  disabled={isViewMode}
                />
              </div>

            </div>

          </div>
        </section>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">

          <button
            type="button"
            onClick={() => router.push("/products")}
            className="form-secondary-button"
          >
            {isViewMode ? "Back" : "Cancel"}
          </button>

          {isViewMode && product && (
            <button
              type="button"
              onClick={() => router.push(`/products/${product.id}/edit`)}
              className="form-primary-button"
            >
              Edit product
            </button>
          )}

          {isCreateMode && (
            <button
              type="button"
              onClick={handleCreateProduct}
              className="form-primary-button"
            >
              Create product
            </button>
          )} 

          {isEditMode && (
            <button
              type="button"
              onClick={handleUpdateProduct}
              className="form-primary-button"
            >
              Update product
            </button>
          )}

        </div>
      </div>
    </div>
  );
}