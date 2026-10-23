"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { ExpenseData, ExpenseItem } from "@/types/expense";
import LoadingSpinner from "@/components/loading_spinner";

type ExpenseFormProps = {
  mode: "create" | "edit" | "view";
  expense?: ExpenseData;
};

type Payee = {
  id: number;
  name: string;
  payee_type: "SUPPLIER" | "EMPLOYEE" | "OTHER";
};

type Product = {
  id: number;
  name: string;
  stock_quantity: number;
  cost: number;
};

type ExpenseCategory = {
  id: number;
  name: string;
};

type InventoryExpenseItem = {
  id?: number;
  product_id: number | null;
  quantity: number;
  unit_price: number;
  vat_rate: number;
  subtotal: number;
  vat_total: number;
  total: number;
};

type OtherExpenseItem = {
  id?: number;
  category_id: number | null;
  description: string;
  amount: number;
  vat_rate: number;
  subtotal: number;
  vat_total: number;
  total: number;
};

export default function ExpenseForm({
  mode,
  expense,
}: ExpenseFormProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [payees, setPayees] = useState<Payee[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [payeeId, setPayeeId] = useState(expense?.payee_id ? String(expense.payee_id)  : "");
  const [expenseNumber, setExpenseNumber] = useState(expense?.expense_number ? String(expense.expense_number) : "");
  const [expenseDate, setExpenseDate] = useState(expense?.expense_date ? new Date().toISOString().split("T")[0] : new Date().toISOString().split("T")[0] );
  const [paymentMethod, setPaymentMethod] = useState(expense?.payment_method ?? "");
  const [status, setStatus] = useState(expense?.status ?? "");
  const [openBalance, setOpenBalance] = useState(expense?.open_balance ?? "");
  const [memo, setMemo] = useState(expense?.memo ?? "");
  const [inventoryItems, setInventoryItems] = useState<InventoryExpenseItem[]>([]);
  const [otherItems, setOtherItems] = useState<OtherExpenseItem[]>([]);
  const isViewMode = mode === "view";
  const isCreateMode = mode === "create";
  const isEditMode = mode === "edit";
  const items = [
    ...inventoryItems.map((item, index) => ({
      id: item.id,
      product_id: item.product_id,
      category_id: null,
      line_number: index + 1,
      description:
        products.find((product) => product.id === item.product_id)?.name ?? "",
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.subtotal,
      vat_rate: item.vat_rate,
      vat_total: item.vat_total,
      total: item.total,
    })),

    ...otherItems.map((item, index) => ({
      id: item.id,
      product_id: null,
      category_id: item.category_id,
      line_number: inventoryItems.length + index + 1,
      description: item.description,
      quantity: 1,
      unit_price: item.amount,
      subtotal: item.subtotal,
      vat_rate: item.vat_rate,
      vat_total: item.vat_total,
      total: item.total,
    })),
  ];

  useEffect(() => {
    const fetchFormData = async () => {
      try {
        const [
          payeesResponse,
          productsResponse,
          categoriesResponse,
        ] = await Promise.all([
          fetch("/api/payees"),
          fetch("/api/products"),
          fetch("/api/expense_categories"),
        ]);

        if (!payeesResponse.ok) {
          throw new Error("Failed to load payees");
        }

        if (!productsResponse.ok) {
          throw new Error("Failed to load products");
        }

        if (!categoriesResponse.ok) {
          throw new Error(
            "Failed to load expense categories"
          );
        }

        const payeesData =
          await payeesResponse.json();

        const productsData =
          await productsResponse.json();

        const categoriesData =
          await categoriesResponse.json();

        setPayees(payeesData);
        setProducts(productsData);
        setCategories(categoriesData);
        console.log(payees, products, categories);
      } catch (error) {
        console.error(error);

        toast.error(
          "Failed to load expense form data."
        );
      } finally {
        setLoadingData(false);
      }
    };

    fetchFormData();
  }, []);

  useEffect(() => {
    if (mode === "create" || !expense?.items) {
      return;
    }

    const inventory: InventoryExpenseItem[] = [];
    const other: OtherExpenseItem[] = [];

    expense.items.forEach((item: ExpenseItem) => {
      if (item.product_id) {
        inventory.push({
          id: item.id,
          product_id: item.product_id,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          vat_rate: Number(item.vat_rate),
          subtotal: Number(item.subtotal),
          vat_total: Number(item.vat_total),
          total: Number(item.total),
        });
      } else {
        other.push({
          id: item.id,
          category_id: item.category_id ?? null,
          description: item.description ?? "",
          amount: Number(item.unit_price),
          vat_rate: Number(item.vat_rate),
          subtotal: Number(item.subtotal),
          vat_total: Number(item.vat_total),
          total: Number(item.total),
        });
      }
    });

    setInventoryItems(inventory);
    setOtherItems(other);
  }, [mode, expense]);

  const updateInventoryItem = (
    index: number,
    changes: Partial<InventoryExpenseItem>
  ) => {
    setInventoryItems((prev) => {
      const updated = [...prev];

      const item = {
        ...updated[index],
        ...changes,
      };

      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unit_price) || 0;
      const vatRate = Number(item.vat_rate) || 0;

      const subtotal = quantity * unitPrice;
      const vatTotal = subtotal * (vatRate / 100);
      const total = subtotal + vatTotal;

      updated[index] = {
        ...item,
        subtotal,
        vat_total: vatTotal,
        total,
      };

      return updated;
    });
  };

  const updateOtherItem = (
    index: number,
    updates: Partial<OtherExpenseItem>
  ) => {
    setOtherItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;

        const updated = { ...item, ...updates };

        const subtotal = Number(updated.amount) || 0;
        const vatRate = Number(updated.vat_rate) || 0;
        const vatTotal = subtotal * (vatRate / 100);
        const total = subtotal + vatTotal;

        return {
          ...updated,
          subtotal,
          vat_total: vatTotal,
          total,
        };
      })
    );
  };

  const addInventoryItem = () => {
    setInventoryItems((prev) => [
      ...prev,
      {
        product_id: null,
        quantity: 1,
        unit_price: 0,
        vat_rate: 17.5,
        subtotal: 0,
        vat_total: 0,
        total: 0,
      },
    ]);
  };

  const addOtherItem = () => {
    setOtherItems((prev) => [
      ...prev,
      {
        category_id: null,
        description: "",
        amount: 0,
        vat_rate: 17.5,
        subtotal: 0,
        vat_total: 0,
        total: 0,
      },
    ]);
  };

  const removeInventoryItem = (index: number) => {
    setInventoryItems((prev) =>
      prev.filter((_, itemIndex) => itemIndex !== index)
    );
  };

  const removeOtherItem = (index: number) => {
    setOtherItems((prev) =>
      prev.filter((_, itemIndex) => itemIndex !== index)
    );
  };

  const handleProductChange = (
    index: number,
    productId: number
  ) => {
    const product = products.find(
      (item) => item.id === productId
    );

    if (!product) return;

    updateInventoryItem(index, {
      product_id: product.id,
      unit_price: Number(product.cost) || 0,
      quantity: 1,
    });
  };

  const handleCategoryChange = (index: number, categoryId: number) => {
    updateOtherItem(index, {
      category_id: categoryId,
    });
  };

  const handleCreateExpense = async () => {
    if (loading) return;

    if (!payeeId) {
      toast.error("Please select a payee.");
      return;
    }

    if (!expenseDate) {
      toast.error("Expense date is required.");
      return;
    }

    if (!paymentMethod) {
      toast.error("Please select a payment method.");
      return;
    }

    if (items.length === 0) {
      toast.error("Please add at least one expense item.");
      return;
    }

    const hasInvalidInventoryItem = inventoryItems.some(
      (item) =>
        !item.product_id ||
        Number(item.quantity) <= 0 ||
        Number(item.unit_price) < 0 ||
        Number(item.vat_rate) < 0
    );

    if (hasInvalidInventoryItem) {
      toast.error(
        "Please complete all inventory items with valid quantities, costs, and VAT rates."
      );
      return;
    }

    const hasInvalidOtherItem = otherItems.some(
      (item) =>
        !item.category_id ||
        !item.description.trim() ||
        Number(item.amount) < 0 ||
        Number(item.vat_rate) < 0
    );

    if (hasInvalidOtherItem) {
      toast.error(
        "Please complete the category, description, amount, and VAT rate for all other expenses."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payee_id: Number(payeeId),
          expense_date: expenseDate,
          payment_method: paymentMethod,
          memo: memo || null,
          items,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to create expense."
        );
      }

      toast.success("Expense created successfully.");

      router.push("/expenses");
      router.refresh();
    } catch (error) {
      console.error("Failed to create expense:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create expense."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateExpense = async () => {
    if (loading) return;

    if (!expense?.id) {
      toast.error("Cannot update expense: expense ID is missing.");
      return;
    }

    if (!payeeId) {
      toast.error("Please select a payee.");
      return;
    }

    if (!expenseDate) {
      toast.error("Expense date is required.");
      return;
    }

    if (!paymentMethod) {
      toast.error("Please select a payment method.");
      return;
    }

    if (items.length === 0) {
      toast.error("Please add at least one expense item.");
      return;
    }

    const hasInvalidInventoryItem = inventoryItems.some(
      (item) =>
        !item.product_id ||
        Number(item.quantity) <= 0 ||
        Number(item.unit_price) < 0 ||
        Number(item.vat_rate) < 0
    );

    if (hasInvalidInventoryItem) {
      toast.error(
        "Please complete all inventory items with valid quantities, costs, and VAT rates."
      );
      return;
    }

    const hasInvalidOtherItem = otherItems.some(
      (item) =>
        !item.category_id ||
        !item.description.trim() ||
        Number(item.amount) < 0 ||
        Number(item.vat_rate) < 0
    );

    if (hasInvalidOtherItem) {
      toast.error(
        "Please complete the category, description, amount, and VAT rate for all other expenses."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `/api/expenses/${expense.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            payee_id: Number(payeeId),
            expense_number: expenseNumber,
            expense_date: expenseDate,
            payment_method: paymentMethod,
            open_balance: openBalance,
            status: status,
            memo: memo || null,
            items,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to update expense."
        );
      }

      toast.success("Expense updated successfully.");

      router.push("/expenses");
      router.refresh();
    } catch (error) {
      console.error("Failed to update expense:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update expense."
      );
    } finally {
      setLoading(false);
    }
  };

  const subtotal =
    inventoryItems.reduce((sum, item) => sum + item.subtotal, 0) +
    otherItems.reduce((sum, item) => sum + item.subtotal, 0);

  const vatTotal =
    inventoryItems.reduce((sum, item) => sum + item.vat_total, 0) +
    otherItems.reduce((sum, item) => sum + item.vat_total, 0);

  const total =
    inventoryItems.reduce((sum, item) => sum + item.total, 0) +
    otherItems.reduce((sum, item) => sum + item.total, 0);

  if (loadingData) {
    return <LoadingSpinner />;
  }

  console.log("Inventory Items: ", inventoryItems, "\n\nOther Items: ", otherItems);

  return (
    <div className="">
      <div className="">
        
        {/* Payee Information */}
        <section className="form-section">
          <div className="mb-6">
            <h2 className="form-section-title">
              Payee Information
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Payee */}
            <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                Payee
                </label>

                <select
                  value={payeeId}
                  onChange={(e) =>
                      setPayeeId(e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                  disabled={isViewMode}
                >
                  <option value="">
                      Select payee
                  </option>

                  {payees.map((payee) => (
                      <option
                        key={payee.id}
                        value={payee.id}
                        >
                        {payee.name} —{" "}
                        {payee.payee_type === "SUPPLIER"
                            ? "Supplier"
                            : payee.payee_type === "EMPLOYEE"
                            ? "Employee"
                            : "Other"}
                      </option>
                  ))}
                </select>
            </div>

            {/* Expense Date */}
            <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                Expense Date
                </label>

                <input
                  type="date"
                  value={expenseDate}
                  onChange={(e) =>
                      setExpenseDate(e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                  disabled={isViewMode}
                />
            </div>

            {/* Payment Method */}
            <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                Payment Method
                </label>

                <select
                  value={paymentMethod}
                  onChange={(e) =>
                      setPaymentMethod(e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                  disabled={isViewMode}
                >
                  <option value="">
                      Select payment method
                  </option>

                  <option value="Cash">
                      Cash
                  </option>

                  <option value="Debit Card">
                      Debit Card
                  </option>

                  <option value="Credit Card">
                      Credit Card
                  </option>

                  <option value="Bank Transfer">
                      Bank Transfer
                  </option>

                  <option value="Cheque">
                      Cheque
                  </option>

                  <option value="Other">
                      Other
                  </option>
                </select>
            </div>

            {/* Memo */}
            <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                Memo
                </label>

                <input
                  type="text"
                  value={memo}
                  onChange={(e) =>
                      setMemo(e.target.value)
                  }
                  placeholder="Optional memo"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                  disabled={isViewMode}
                />
            </div>

          </div>
        </section>

        {/* Expense Information */}
        <section className="form-section">
          <div className="border-t border-slate-200 pt-6">
            <h2 className="text-lg font-semibold">
              Expense Items
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Add inventory purchases or
              non-inventory expenses.
            </p>
          </div>

          {/* Inventory Purchase Expenses */}
          <section className="form-section">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    Inventory Purchases
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={addInventoryItem}
                  className="rounded-lg border border-green-600 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-50 disabled:hidden"
                  disabled={isViewMode}
                >
                  + Add Product
                </button>
              </div>

              {inventoryItems.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                  <p className="text-sm text-slate-500">
                    No inventory purchases added.
                  </p>

                  <button
                    type="button"
                    onClick={addInventoryItem}
                    className="mt-3 text-sm font-medium text-green-700 hover:text-green-800 disabled:hidden"
                    disabled={isViewMode}
                  >
                    + Add Product
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {inventoryItems.map((item, index) => (
                    <div
                      key={item.id ?? `inventory-${index}`}
                      className="rounded-lg border border-slate-200 bg-white p-4"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-800">
                          Product {index + 1}
                        </h3>

                        <button
                          type="button"
                          onClick={() => removeInventoryItem(index)}
                          className="text-sm font-medium text-red-600 hover:text-red-700 disabled:hidden"
                          disabled={isViewMode}
                        >
                          Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                        {/* Product */}
                        <div className="md:col-span-5">
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Product
                          </label>

                          <select
                            value={item.product_id ?? ""}
                            onChange={(e) =>
                              handleProductChange(
                                index,
                                Number(e.target.value)
                              )
                            }
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                            disabled={isViewMode}
                          >
                            <option value="">Select product</option>

                            {products.map((product) => (
                              <option
                                key={product.id}
                                value={product.id}
                              >
                                {product.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Quantity */}
                        <div className="md:col-span-2">
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Quantity
                          </label>

                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateInventoryItem(index, {
                                quantity: Number(e.target.value),
                              })
                            }
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                            disabled={isViewMode}
                          />
                        </div>

                        {/* Unit Cost */}
                        <div className="md:col-span-2">
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Unit Cost
                          </label>

                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) =>
                              updateInventoryItem(index, {
                                unit_price: Number(e.target.value),
                              })
                            }
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                            disabled={isViewMode}
                          />
                        </div>

                        {/* VAT */}
                        <div className="md:col-span-1">
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            VAT %
                          </label>

                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.vat_rate}
                            onChange={(e) =>
                              updateInventoryItem(index, {
                                vat_rate: Number(e.target.value),
                              })
                            }
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                            disabled={isViewMode}
                          />
                        </div>

                        {/* Total */}
                        <div className="md:col-span-2">
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Total
                          </label>

                          <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">
                            {item.total.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Non-Inventory Expenses */}
          <section className="form-section">
            <div className="space-y-4 border-t border-slate-200 pt-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    Other Expenses
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={addOtherItem}
                  className="rounded-lg border border-green-600 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-50 disabled:hidden"
                  disabled={isViewMode}
                >
                  + Add Expense
                </button>
              </div>

              {otherItems.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                  <p className="text-sm text-slate-500">
                    No other expenses added.
                  </p>

                  <button
                    type="button"
                    onClick={addOtherItem}
                    className="mt-3 text-sm font-medium text-green-700 hover:text-green-800 disabled:hidden"
                    disabled={isViewMode}
                  >
                    + Add Expense
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {otherItems.map((item, index) => (
                    <div
                      key={item.id ?? `other-${index}`}
                      className="rounded-lg border border-slate-200 bg-white p-4"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-800">
                          Expense {index + 1}
                        </h3>

                        <button
                          type="button"
                          onClick={() => removeOtherItem(index)}
                          className="text-sm font-medium text-red-600 hover:text-red-700 disabled:hidden"
                          disabled={isViewMode}
                        >
                          Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                        {/* Category */}
                        <div className="md:col-span-3">
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Category
                          </label>

                          <select
                            value={item.category_id ?? ""}
                            onChange={(e) =>
                              handleCategoryChange(
                                index,
                                Number(e.target.value)
                              )
                            }
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                            disabled={isViewMode}
                          >
                            <option value="">Select category</option>

                            {categories.map((category) => (
                              <option
                                key={category.id}
                                value={category.id}
                              >
                                {category.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Description */}
                        <div className="md:col-span-4">
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Description
                          </label>

                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) =>
                              updateOtherItem(index, {
                                description: e.target.value,
                              })
                            }
                            placeholder="e.g. March electricity bill"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                            disabled={isViewMode}
                          />
                        </div>

                        {/* Amount */}
                        <div className="md:col-span-2">
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Amount
                          </label>

                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.amount}
                            onChange={(e) =>
                              updateOtherItem(index, {
                                amount: Number(e.target.value),
                              })
                            }
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                            disabled={isViewMode}
                          />
                        </div>

                        {/* VAT */}
                        <div className="md:col-span-1">
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            VAT %
                          </label>

                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.vat_rate}
                            onChange={(e) =>
                              updateOtherItem(index, {
                                vat_rate: Number(e.target.value),
                              })
                            }
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                            disabled={isViewMode}
                          />
                        </div>

                        {/* Total */}
                        <div className="md:col-span-2">
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Total
                          </label>

                          <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">
                            {item.total.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </section>

        {/* Totals & Actions*/}
        <section className="form-section">
          <div className="mb-6 flex justify-end">
            <div className="w-full max-w-sm space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-medium text-slate-900">
                  ${subtotal.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">VAT</span>
                <span className="font-medium text-slate-900">
                  ${vatTotal.toFixed(2)}
                </span>
              </div>

              <div className="border-t border-slate-200 pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">Total</span>
                  <span className="text-lg font-bold text-slate-900">
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-6">
            <button
              type="button"
              onClick={() => router.push("/expenses")}
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              {isViewMode ? "Back" : "Cancel"}
            </button>

            {isViewMode && expense && (
              <button
                type="button"
                onClick={() => router.push(`/expenses/${expense.id}/edit`)}
                disabled={loading}
                className="form-primary-button disabled:cursor-not-allowed disabled:opacity-60"
              >
                Edit Expense
              </button>
            )} 

            {isCreateMode && (
              <button
                type="button"
                onClick={handleCreateExpense}
                disabled={loading}
                className="form-primary-button disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating..." : "Create Expense"}
              </button>
            )} 

            {isEditMode && (
              <button
                type="button"
                onClick={handleUpdateExpense}
                disabled={loading}
                className="form-primary-button disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Updating..." : "Update Expense"}
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}