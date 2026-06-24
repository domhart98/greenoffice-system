"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ProductsPage() {
  const [products, setproducts] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
        const response = await fetch(
            `/api/products?search=${encodeURIComponent(search)}`
        );

        const data = await response.json();

        setproducts(data);
    };

    fetchProducts();
  }, [search]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        product
      </h1>
    
      <div className="mb-4">
        <input className="w-1/3 border rounded p-2"
            type="text"
            placeholder="Search product name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <table className="w-full border mb-8">
        <thead>
          <tr>
            <th>ID</th>
            <th>SKU</th>
            <th>Name</th>
            <th>Price</th>
            <th>VAT Rate</th>
            <th>Stock</th>
            <th>Created On</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {products.map((product: any) => (
            <tr className="text-center" key={product.id}>
              <td>
                <Link className="text-blue-600 underline" href={`/products/${product.id}`}>
                    {product.id}
                </Link>
              </td>
              <td>{product.sku}</td>
              <td>{product.name}</td>
              <td>${product.price}</td>
              <td>{product.vat_rate}</td>
              <td>
                <span className={
                      product.stock_quantity <= 10
                      ? "text-red-600 font-bold"
                      : product.stock_quantity <= 25
                      ? "text-yellow-600 font-semibold"
                      : "text-green-600"
                  }
                >
                  {product.stock_quantity}
                </span>
              </td>
              <td>{new Date(product.created_at).toLocaleDateString()}</td>
              <td>
                <a className="text-blue-600" href={`/products/${product.id}`}>
                    View
                </a>
                <button className="text-red-600"
                  onClick={async () => {
                    const confirmed = confirm(
                      "Delete this product?"
                    );

                    if (!confirmed) return;

                    const response = await fetch(
                      `/api/products/${product.id}`,
                      {
                        method: "DELETE",
                      }
                    );

                    const result = await response.json();

                    console.log(result);

                    if (result.success) {
                      window.location.reload();
                    }
                  }}
                >
                  Delete
                </button>
                <a className="text-blue-600" href={`/products/${product.id}/edit`}>
                    Edit
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <a className="bg-green-300 rounded-full p-2 mt-8" href="/products/new">Add New products</a>
    </div>
  );
}