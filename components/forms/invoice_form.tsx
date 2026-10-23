"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Product } from "@/types/product";
import { Customer } from "@/types/customer";
import { InvoiceData, InvoiceItem } from "@/types/invoice";

interface InvoiceFormProps {
  mode: "create" | "edit";
  invoice?: InvoiceData;
}

export default function InvoiceForm({
  mode,
  invoice,
}: InvoiceFormProps) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState(0);
  const [invoiceNumber, setInvoiceNumber] = useState(invoice?.invoice_number ?? 0);
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerState, setCustomerState] = useState("");
  const [customerCountry, setCustomerCountry] = useState("");
  const [customerCity, setCustomerCity] = useState("");
  const [customerFullAddress, setCustomerFullAddress] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(invoice?.invoice_date ? new Date(invoice.invoice_date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(invoice?.due_date ? new Date(invoice.due_date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]);
  const [terms, setTerms] = useState("Due on receipt");
  const [isSaving, setIsSaving] = useState(false);

  const [items, setItems] = useState<any[]>(
    mode === "edit" && invoice
      ? invoice.items : [
        {
          id: 0,
          quantity: 1,
          product_id: 0,
          product_name: "",
          product_price: 0,
          stock_quantity: 0,
          vat_rate: 17.5,
          vat_total: 0,
          subtotal: 0,
          total: 0,
        },
      ]
  );

  const addItem = () => {
    setItems([
      ...items,
      {
        id: 0,
        quantity: 1,
        product_id: 0,
        product_name: "",
        product_price: 0,
        stock_quantity: 0,
        vat_rate: 17.5,
        vat_total: 0,
        subtotal: 0,
        total: 0,
      },
    ]);
  };

  const updateItem = (
    index: number,
    field: keyof InvoiceItem,
    value: string | number
  ) => {
    const updated = [...items];

    const product = products.find(
      (p) => p.id === updated[index].product_id
    );

    if (
      field === "quantity" &&
      product &&
      Number(value) > product.stock_quantity
    ) {
      alert(`Only ${product.stock_quantity} units available`);
      return;
    }

    const updatedItem = {
      ...updated[index],
      [field]:
        field === "quantity" ||
        field === "product_price" ||
        field === "vat_rate"
          ? Number(value)
          : value,
    };

    const quantity = Number(updatedItem.quantity) || 0;
    const price = Number(updatedItem.product_price) || 0;
    const vatRate = Number(updatedItem.vat_rate) || 0;

    const lineSubtotal = quantity * price;
    const lineVat = lineSubtotal * (vatRate / 100);
    const lineTotal = lineSubtotal + lineVat;

    updatedItem.subtotal = lineSubtotal;
    updatedItem.vat_total = lineVat;
    updatedItem.total = lineTotal;

    updated[index] = updatedItem;

    setItems(updated);
  };

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.subtotal || 0),
    0
  );

  const vat = items.reduce(
    (sum, item) => sum + Number(item.vat_total || 0),
    0
  );

  const total = items.reduce(
    (sum, item) => sum + Number(item.total || 0),
    0
  );

  const handleProductChange = (
    index: number,
    productId: number
  ) => {
    const product = products.find(
      (p) => p.id === productId
    );

    if (!product) return;

    const quantity = Number(items[index].quantity) || 1;
    const price = Number(product.price) || 0;
    const vatRate = 17.5;

    const subtotal = quantity * price;
    const vatTotal = subtotal * (vatRate / 100);
    const total = subtotal + vatTotal;

    const updated = [...items];

    updated[index] = {
      ...updated[index],
      id: 0,
      product_id: product.id,
      product_name: product.name,
      product_price: price,
      stock_quantity: product.stock_quantity,
      vat_rate: vatRate,
      subtotal,
      vat_total: vatTotal,
      total,
    };

    setItems(updated);
  };

  const handleCustomerChange = (customerId: string) => {
    const customer:any = customers.find(
      (c) => c.id === Number(customerId)
    );

    if(!customer) return;

    setCustomerId(Number(customerId));
    setCustomerName(customer.name);
    setCustomerPhone(customer.phone);
    setCustomerEmail(customer.email);

    const fullAddress = [ customer.address, customer.state, customer.city, customer.country,].filter(Boolean).join(", \n");
    setCustomerFullAddress(fullAddress);

    console.log(customer.id);
  
  }

  const handleCreateInvoice = async () => {
    if (isSaving) return;

    if (!customerId) {
      alert("Please select a customer.");
      return;
    }

    if (items.length === 0) {
        alert("Please add at least one product.");
      return;
    }

    const invalidItem = items.find(
      (item) =>
        !item.product_id ||
        Number(item.quantity) <= 0 ||
        Number(item.product_price) < 0
    );

    if (invalidItem) {
      alert("Please complete all invoice items before saving.");
      return;
    }

    try {
      setIsSaving(true);

      const invoiceData = {
        invoice_number: invoiceNumber,
        customer_name: customerName,
        customer_address: customerAddress,
        invoice_date: invoiceDate,
        due_date: dueDate,
        terms,
        customer_id: customerId,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        items,
      };

      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invoiceData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "Failed to save invoice."
        );
      }

      alert(`Invoice #${invoiceNumber} saved as draft.`);

      router.push(`/invoices/${invoiceNumber}`);
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to save invoice."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateInvoice = async () => {
    if (isSaving) return;

    if (!customerId) {
      alert("Please select a customer.");
      return;
    }

    if (items.length === 0) {
      alert("Please add at least one product.");
      return;
    }

    const invalidItem = items.find(
      (item) =>
        !item.product_id ||
        Number(item.quantity) <= 0 ||
        Number(item.product_price) < 0
    );

    if (invalidItem) {
      alert("Please complete all invoice items before saving.");
      return;
    }

    try {
      setIsSaving(true);

      const invoiceData = {
        invoice_number: invoiceNumber,
        customer_name: customerName,
        customer_address: customerAddress,
        invoice_date: invoiceDate,
        due_date: dueDate,
        terms,
        customer_id: customerId,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        items,
      };

      const response = await fetch(`/api/invoices/${invoiceNumber}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invoiceData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "Failed to save invoice."
        );
      }

      alert(`Invoice #${invoiceNumber} saved as draft.`);

      router.push(`/invoices/${invoiceNumber}`);
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to save invoice."
      );
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (mode === "edit" && invoice) {
      setCustomerId(invoice.customer_id);
      setCustomerName(invoice.customer_name);
      setCustomerAddress(invoice.customer_address);
      setCustomerPhone(invoice.customer_phone);
      setCustomerEmail(invoice.customer_email);
      setCustomerFullAddress([invoice.customer_address, invoice.customer_city, invoice.customer_state, invoice.customer_country].filter(Boolean).join(", \n"));
    }
  }, [mode, invoice]);

  useEffect(() => {
    if (mode === "create") {
      fetch("/api/invoices/next-number")
        .then((res) => res.json())
        .then((data) => {
          setInvoiceNumber(data.invoiceNumber);
        });
    }
  }, [mode]);

  useEffect(() => {
    fetch("/api/products")
        .then((res) => res.json())
        .then((data) => {
        setProducts(data);
        });
    }, 
  []);

  useEffect(() => {
    fetch("/api/customers")
        .then((res) => res.json())
        .then((data) => {
        setCustomers(data);
        });
    }, 
  []);

  console.log("Invoice Number: ",invoiceNumber,"\nMode: ",mode,"\nInvoice Data: ",invoice,"\nFull Address: ",customerFullAddress);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block mb-2">Invoice #</label>
          <input className="w-full rounded-md border bg-gray-100 border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  value={invoiceNumber}
                  disabled={true}
          />
        </div>

        <div>
          <label className="block mb-2">Invoice Date</label>
          <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500" type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
          />
        </div>

        <div>
          <label className="block mb-1">
            Due Date
          </label>

          <input
            type="date"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            value={dueDate}
            onChange={(e) =>
              setDueDate(e.target.value)
            }
          />
        </div>

        <div>
            <label className="block mb-2">Terms</label>
            <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                   value={terms}
                   onChange={(e) => setTerms(e.target.value)}
            />
        </div>
        </div>
          <label className="block mb-1">
            Customer
          </label>
          <select 
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            value={customerId ?? ""}
            onChange={(e) => handleCustomerChange(e.target.value)}
          >
            <option value="">
                Select Customer
            </option>

            {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
            ))}
          </select>
        <div>
        <label className="block mb-2">Customer Name</label>
        <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500" type="text"
               value={customerName}
               onChange={(e) => setCustomerName(e.target.value)}
        />
      </div>

      <div>
        <label className="block mb-2">Customer Address</label>
        <textarea className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  value={customerFullAddress}
                  onChange={(e) => setCustomerFullAddress(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full border-collapse">
          <thead className="bg-slate-50">
            <tr className="text-left text-sm font-semibold text-slate-700">
              <th className="px-3 py-3">Qty</th>
              <th className="px-3 py-3 min-w-[240px]">Product</th>
              <th className="px-3 py-3 text-center">Stock</th>
              <th className="px-3 py-3 text-right">Price</th>
              <th className="px-3 py-3 text-right">VAT %</th>
              <th className="px-3 py-3 text-right">VAT</th>
              <th className="px-3 py-3 text-right">Total</th>
              <th className="px-3 py-3 text-center"> </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {items.map((item, index) => (
              <tr key={index} className="align-middle">
                
                {/* Quantity */}
                <td className="px-3 py-3">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(
                        index,
                        "quantity",
                        Number(e.target.value)
                      )
                    }
                    className="w-20 rounded-md border border-slate-300 px-2 py-2 text-sm text-right focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                </td>

                {/* Product */}
                <td className="px-3 py-3">
                  <select
                    value={item.product_id || ""}
                    onChange={(e) =>
                      handleProductChange(
                        index,
                        Number(e.target.value)
                      )
                    }
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  >
                    <option value="">
                      Select product
                    </option>

                    {products.map((product) => (
                      <option
                        key={product.id}
                        value={product.id}
                        disabled={product.stock_quantity <= 0}
                      >
                        {product.name}
                      </option>
                    ))}
                  </select>
                </td>

                {/* Stock */}
                <td className="px-3 py-3 text-center text-sm text-slate-500">
                  {item.product_id
                    ? item.stock_quantity
                    : "—"}
                </td>

                {/* Price */}
                <td className="px-3 py-3">
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                      $
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.product_price}
                      onChange={(e) =>
                        updateItem(
                          index,
                          "product_price",
                          Number(e.target.value)
                        )
                      }
                      className="w-28 rounded-md border border-slate-300 py-2 pl-6 pr-2 text-right text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  </div>
                </td>

                {/* VAT Rate */}
                <td className="px-3 py-3">
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.vat_rate}
                      onChange={(e) =>
                        updateItem(
                          index,
                          "vat_rate",
                          Number(e.target.value)
                        )
                      }
                      className="w-24 rounded-md border border-slate-300 py-2 pl-2 pr-6 text-right text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    />

                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                      %
                    </span>
                  </div>
                </td>

                {/* VAT Amount */}
                <td className="px-3 py-3 text-right text-sm text-slate-600">
                  ${Number(item.vat_total || 0).toFixed(2)}
                </td>

                {/* Total */}
                <td className="px-3 py-3 text-right text-sm font-semibold text-slate-900">
                  ${Number(item.total || 0).toFixed(2)}
                </td>

                {/* Remove */}
                <td className="px-3 py-3 text-center">
                  <button
                    type="button"
                    onClick={() =>
                      setItems(
                        items.filter((_, i) => i !== index)
                      )
                    }
                    className="rounded-md px-2 py-1 text-sm text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={addItem}
        className="mt-4 inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        <span className="mr-2 text-lg leading-none">+</span>
        Add Product
      </button>

      <div className="flex justify-end mt-6">
        <div className="w-80 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex justify-between py-1 text-sm text-slate-600">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between py-1 text-sm text-slate-600">
            <span>VAT</span>
            <span>${vat.toFixed(2)}</span>
          </div>

          <div className="my-3 border-t border-slate-200" />

          <div className="flex justify-between text-lg font-bold text-slate-900">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 pt-6 mt-6">
        <button
          type="button"
          onClick={() => router.push("/invoices")}
          disabled={isSaving}
          className="rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancel
        </button>

        
        <div className="flex gap-3">
          { mode==='create' ? 
            <button
              type="button"
              onClick={handleCreateInvoice}
              disabled={isSaving}
              className="inline-flex min-w-[120px] items-center justify-center rounded-md bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating...
                </>
              ) : (
                "Create Draft"
              )}
            </button>

            :

            <button
              type="button"
              onClick={handleUpdateInvoice}
              disabled={isSaving}
              className="inline-flex min-w-[120px] items-center justify-center rounded-md bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Updating
                </>
              ) : (
                "Update Draft"
              )}
            </button>

          }
          
        </div>
      </div>
    </div>
  );
}