"use client";

import DataTable from "@/components/data-table/data_table";
import DataTableToolbar from "@/components/data-table/data_table_toolbar";
import DataTablePagination from "@/components/data-table/data_table_pagination";
import { useDataTable } from "@/app/hooks/use_data_table";
import { Column } from "@/components/data-table/types";
import LoadingSpinner from "@/components/loading_spinner";
import { useEffect, useState } from "react";
import { Customer } from "@/types/customer";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ConfirmDialogue from "@/components/ui/confirm_dialogue";
import toast from "react-hot-toast";
import { stringify } from "querystring";
import { Plus } from "lucide-react";

export default function CustomersPage() {

  const router = useRouter();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const table = useDataTable(customers, 20);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const columns: Column<(typeof customers)[number]>[] = [
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
      key: "company_name",
      header: "Company",
      sortable: true,
    },
    {
      key: "address",
      header: "Address"
    },
    {
      key: "phone",
      header: "Phone"
    },
    {
      key: "email",
      header: "Email"
    },
    {
      key: "notes",
      header: "Notes"
    }
  ];

  useEffect(() => {
    const fetchCustomers = async () => {
        const response = await fetch(
            `/api/customers`
        );

        const data = await response.json();

        setCustomers(data);
        setLoading(false);
    };

    fetchCustomers();
  }, []);

  const handleSearchChange = (value: string) => {
    table.setSearch(value);
    table.setCurrentPage(1);
  };

  const handleView = (customer: Customer) => {
    router.push(`/customers/${customer.id}`);
  };

  const handleEdit = (customer: Customer) => {
      router.push(`/customers/${customer.id}/edit`);
  };

  const handleDelete = async () => {
    try{
      setIsDeleting(true);

      await fetch(`/api/customers/${customerToDelete!.id}`, {
        method: "DELETE",
      });

      setCustomers((prev) =>
        prev.filter(
          (customer:any) => customer.id !== customerToDelete!.id
        )
      );

      setCustomerToDelete(null);
      setIsDeleting(false);

    } catch (error) {
      console.log(error);
      toast.error("Failed to Delete Customer.");
    }  
  }; 

  if (loading) {
    return <LoadingSpinner/>;
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 px-6 pt-6 pb-4">
        <h1 className="text-2xl font-bold mb-6">
          Customers
        </h1>
      </div>
      <div className="flex min-h-0 flex-1 flex-col px-6 pb-6">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <DataTableToolbar 
            search={table.search} 
            onSearchChange={handleSearchChange}
            actions={
              <Link href="/customers/new"
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-md font-medium text-white transition hover:bg-emerald-700">
                <Plus size={16} strokeWidth={2} />
                Add Customer
              </Link>
            }
          />
        
          <DataTable data={table.paginatedData} 
                    columns={columns} 
                    rowKey={"id"} 
                    sortColumn={table.sortColumn as string} 
                    sortDirection={table.sortDirection} 
                    onSort={(column) => table.handleSort(column as keyof Customer)} 
                    onEdit={handleEdit} 
                    onDelete={(customer) => setCustomerToDelete(customer)}
                    onView={handleView} />
    
          <DataTablePagination currentPage={table.currentPage} totalPages={table.totalPages} onPageChange={table.setCurrentPage}/>
        </div>
        

        <ConfirmDialogue
            open={customerToDelete !== null}
            title="Delete Customer"
            message={
                customerToDelete
                    ? `Are you sure you want to delete "${customerToDelete.name}"? This action cannot be undone.`
                    : ""
            }
            loading={isDeleting}
            onCancel={() => setCustomerToDelete(null)}
            onConfirm={handleDelete}
        />
      </div>
    </div>
  );
}