"use client";

import DataTable from "@/components/data-table/data_table";
import DataTableToolbar from "@/components/data-table/data_table_toolbar";
import DataTablePagination from "@/components/data-table/data_table_pagination";
import DataTableFilter from "@/components/data-table/data_table_filter";
import { useDataTable } from "@/app/hooks/use_data_table";
import { Column } from "@/components/data-table/types";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import LoadingSpinner from "@/components/loading_spinner";
import { useRouter } from "next/navigation";
import ConfirmDialogue from "@/components/ui/confirm_dialogue";
import toast from "react-hot-toast";
import { stringify } from "querystring";
import { Product } from "@/types/product";
import { Plus } from "lucide-react";

export default function ProductsPage() {

  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const filters = useMemo(
    () => [
      {
        key: "type" as keyof Product,
        value: type,
      },
      {
        key: "category" as keyof Product,
        value: category,
      },
    ],
    [type, status, category]
  );
  const table = useDataTable(
    products, 
    20,
    [
      "name",
      "sales_description",
    ],
    filters
  );

  const columns: Column<(typeof products)[number]>[] = [
    {
      key: "id",
      header: "ID"
    },
    {
      key: "name",
      header: "Name",
      sortable: true,
    },
    {
      key: "sales_description",
      header: "Sales Description"
    },
    {
      key: "stock_quantity",
      header: "Stock Quantity"
    },
    {
      key: "category",
      header: "Category"
    },
    {
      key: "sku",
      header: "SKU"
    },
    {
      key: "type",
      header: "Type"
    },
    {
      key: "price",
      header: "Price"
    },
    {
      key: "cost",
      header: "Cost"
    },
    {
      key: "reorder_point",
      header: "Reorder Point"
    }
  ]

  const typeOptions = useMemo(() => {
    const values = products
      .map((product: Product) => product.type)
      .filter(Boolean);

    return [...new Set(values)]
      .sort()
      .map((value) => ({
        value: String(value),
        label: String(value),
      }));
  }, [products]);

  const categoryOptions = useMemo(() => {
    const values = products
      .map((product: Product) => product.category)
      .filter(Boolean);

    return [...new Set(values)]
      .sort()
      .map((value) => ({
        value: String(value),
        label: String(value),
      }));
  }, [products]);

  useEffect(() => {
    const fetchProducts = async () => {
        const response = await fetch(
            `/api/products`
        );

        const data = await response.json();

        setProducts(data);
        setLoading(false);
    };

    fetchProducts();
  }, []);

  const handleSearchChange = (value: string) => {
    table.setSearch(value);
    table.setCurrentPage(1);
  };

  const handleTypeChange = (value: string) => {
    setType(value);
    table.setCurrentPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    table.setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setType("");
    setCategory("");
    table.setSearch("");
    table.setCurrentPage(1);
  };
  
  const handleView = (product: Product) => {
    router.push(`/products/${product.id}`);
  };
  
  const handleEdit = (product: Product) => {
    router.push(`/products/${product.id}/edit`);
  };

  const handleDelete = async () => {
    try{
      setIsDeleting(true);

      await fetch(`/api/products/${productToDelete!.id}`, {
        method: "DELETE",
      });

      setProducts((prev) =>
        prev.filter(
          (product:any) => product.id !== productToDelete!.id
        )
      );

      setProductToDelete(null);
      setIsDeleting(false);

    } catch (error) {
      console.log(error);
      toast.error("Failed to Delete Product.");
    }  
  }; 

  if (loading) {
    return <LoadingSpinner/>;
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 px-6 pt-6 pb-4">
        <h1 className="text-2xl font-bold mb-6">
          Products
        </h1>
      </div>
      
      <div className="flex min-h-0 flex-1 flex-col px-6 pb-6">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <DataTableToolbar 
            search={table.search} 
            onSearchChange={handleSearchChange} 
            onClearFilters={handleClearFilters}
            filters={
              <>
              <DataTableFilter
                value={type}
                onChange={handleTypeChange}
                placeholder="Type"
                options={typeOptions}
              />

              <DataTableFilter
                value={category}
                onChange={handleCategoryChange}
                placeholder="Category"
                options={categoryOptions}
              />
              </>
            }
            actions={
              <Link href="/products/new"
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700">
                <Plus size={16} strokeWidth={2} />
                Add Product
              </Link>
            }
          />

          <DataTable data={table.paginatedData} 
                    columns={columns} 
                    rowKey={"id"} 
                    sortColumn={table.sortColumn as string} 
                    sortDirection={table.sortDirection} 
                    onSort={(column) => table.handleSort(column as keyof Product)} 
                    onEdit={handleEdit} 
                    onDelete={(product) => setProductToDelete(product)}
                    onView={handleView} />

          <DataTablePagination currentPage={table.currentPage} totalPages={table.totalPages} onPageChange={table.setCurrentPage}></DataTablePagination>
        </div>
        

        <ConfirmDialogue
            open={productToDelete !== null}
            title="Delete Product"
            message={
                productToDelete
                    ? `Are you sure you want to delete "${productToDelete.name}"? This action cannot be undone.`
                    : ""
            }
            loading={isDeleting}
            onCancel={() => setProductToDelete(null)}
            onConfirm={handleDelete}
        />
      </div>
    </div>
  );
}