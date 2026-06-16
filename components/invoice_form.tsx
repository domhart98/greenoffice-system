"use client";

import { useState, useEffect } from "react";
import { custom } from "zod";
import { Product } from "@/types/product";

type Item = {
  productId?: number;
  quantity: number;
  description: string;
  rate: number;
};

export default function InvoiceForm() {

  const [products, setProducts] = useState<Product[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState<number>();  
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [terms, setTerms] = useState("Due on receipt");

  const [items, setItems] = useState<Item[]>([
    {
      quantity: 1,
      description: "",
      rate: 0,
    },
  ]);

  const addItem = () => {
    setItems([
      ...items,
      {
        quantity: 1,
        description: "",
        rate: 0,
      },
    ]);
  };

  const updateItem = (
    index: number,
    field: keyof Item,
    value: string | number
  ) => {
    const updated = [...items];

    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    setItems(updated);
  };

  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.rate,
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

    const updated = [...items];

    updated[index] = {
        ...updated[index],
        productId: product.id,
        description: product.name,
        rate: Number(product.price),
    };

    setItems(updated);
  };

  const handleGenerateInvoice = async () => {
    const invoiceData = {
        invoiceNumber,
        customerName,
        customerAddress,
        invoiceDate,
        terms,
        subtotal,
        vat,
        total,
        items,
    };

    console.log(invoiceData);

    const response = await fetch(
        "/api/invoices/create",
        {
        method: "POST",

        headers: {
            "Content-Type":
            "application/json",
        },

        body: JSON.stringify(invoiceData),
        }
    );

    const result = await response.json();

    if (!result.success) {
        alert("Failed to save invoice");
        return;
    }

    window.open(
        `/invoices/${result.invoiceNumber}`,
        "_blank"
    );
  };

  const testSave = async () => {
    
  };

  const vat = subtotal * 0.175;

  const total = subtotal + vat;

  useEffect(() => {
    fetch("/api/invoices/next-number")
        .then((res) => res.json())
        .then((data) => {
        setInvoiceNumber(data.invoiceNumber);
        });
    }, 
  []);

  useEffect(() => {
    fetch("/api/products")
        .then((res) => res.json())
        .then((data) => {
        setProducts(data);
        });
    }, 
  []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div>
            <label className="block mb-2">Invoice #</label>
            <input className="border p-2 w-full bg-gray-100"
                   value={invoiceNumber ?? ""}
                   disabled
            />
        </div>

        <div>
            <label className="block mb-2">Invoice Date</label>
            <input className="border p-2 w-full" type="date"
                   value={invoiceDate}
                   onChange={(e) => setInvoiceDate(e.target.value)}
            />
        </div>

        <div>
            <label className="block mb-2">Terms</label>
            <input className="border p-2 w-full"
                   value={terms}
                   onChange={(e) => setTerms(e.target.value)}
            />
        </div>
      </div>
      <div>
        <label className="block mb-2">Customer Name</label>
        <input className="border p-2 w-full" type="text"
               value={customerName}
               onChange={(e) => setCustomerName(e.target.value)}
        />
      </div>

      <div>
        <label className="block mb-2">Customer Address</label>
        <textarea className="border p-2 w-full"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
        />
      </div>

      <table className="w-full border">
        <thead>
          <tr>
            <th className="border p-2">Qty</th>
            <th className="border p-2">Description</th>
            <th className="border p-2">Rate</th>
            <th className="border p-2">Amount</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>

        <tbody>
          {items.map((item, index) => (
            <tr key={index}>
              <td className="border p-2">
                <input className="w-full" type="number"
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(
                      index,
                      "quantity",
                      Number(e.target.value)
                    )}
                />
              </td>

              <td className="border p-2">
                <select
                    value={item.productId || ""}
                    onChange={(e) =>
                        handleProductChange(
                        index,
                        Number(e.target.value)
                        )
                    }
                    >
                    <option value="">
                        Select Product
                    </option>

                    {products.map((product) => (
                        <option
                        key={product.id}
                        value={product.id}
                        >
                        {product.name}
                        </option>
                    ))}
                </select>
              </td>

              <td className="border p-2">
                {(item.rate).toFixed(2)}
              </td>

              <td className="border p-2">
                {(item.quantity * item.rate).toFixed(2)}
              </td>

              <td className="border p-2">
                <button className="text-red-600" type="button"
                    onClick={() =>
                        setItems(items.filter((_, i) => i !== index))
                    }
                >
                    Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        type="button"
        onClick={addItem}
        className="bg-blue-600 text-white px-4 py-2"
      >
        Add Product
      </button>

      <div className="text-right space-y-2">
        <div>
          Subtotal: ${subtotal.toFixed(2)}
        </div>

        <div>
          VAT (17.5%): ${vat.toFixed(2)}
        </div>

        <div className="font-bold text-xl">
          Total: ${total.toFixed(2)}
        </div>
      </div>

      <button className="bg-green-600 text-white px-4 py-2 rounded-full" type="button"
              onClick={handleGenerateInvoice}>
        Generate Invoice
      </button>
      <button className="bg-blue-600 text-white px-4 py-2" type="button"
              onClick={handleGenerateInvoice}
      >
        Test Save
      </button>
    </div>
  );
}