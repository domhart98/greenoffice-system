"use client";

import DataTable from "@/components/data-table/data_table";
import DataTableToolbar from "@/components/data-table/data_table_toolbar";
import DataTablePagination from "@/components/data-table/data_table_pagination";
import { useDataTable } from "@/app/hooks/use_data_table";
import { Column } from "@/components/data-table/types";
import LoadingSpinner from "@/components/loading_spinner";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ConfirmDialogue from "@/components/ui/confirm_dialogue";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";
import DataTableFilter from "@/components/data-table/data_table_filter";

type Payee = {
  id: number;
  name: string;
  payee_type: "SUPPLIER" | "EMPLOYEE" | "OTHER";
  supplier_id: number | null;
  employee_id: number | null;
  company_name: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
};

export default function PayeesPage() {
  const router = useRouter();

  const [payees, setPayees] = useState<Payee[]>([]);
  const [loading, setLoading] = useState(true);
  const [payeeToDelete, setPayeeToDelete] = useState<Payee | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [payeeType, setPayeeType] = useState("");
  const filters = useMemo(
    () => [
      {
        key: "payee_type" as keyof Payee,
        value: payeeType,
      },
    ],
    [payeeType]
  );

  const table = useDataTable(
    payees,
    20,
    [
      "name",
      "company_name",
    ],
    filters
  );

  const columns: Column<Payee>[] = [
    {
      key: "id",
      header: "ID",
    },
    {
      key: "name",
      header: "Name",
      sortable: true,
    },
    {
      key: "payee_type",
      header: "Type",
      sortable: true,
      render: (payee) => {
        const labels = {
          SUPPLIER: "Supplier",
          EMPLOYEE: "Employee",
          OTHER: "Other",
        };

        return labels[payee.payee_type];
      },
    },
    {
      key: "company_name",
      header: "Company",
      sortable: true,
    },
    {
      key: "phone",
      header: "Phone",
    },
    {
      key: "email",
      header: "Email",
    },
  ];

  useEffect(() => {
    const fetchPayees = async () => {
      try {
        const response = await fetch("/api/payees");

        if (!response.ok) {
          throw new Error("Failed to fetch payees");
        }

        const data = await response.json();

        setPayees(data);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load payees.");
      } finally {
        setLoading(false);
      }
    };

    fetchPayees();
  }, []);

  const payeeTypeOptions = useMemo(() => {
      const values = payees
        .map((payee: Payee) => payee.payee_type)
        .filter(Boolean);
  
      return [...new Set(values)]
        .sort()
        .map((value) => ({
          value: String(value),
          label: String(value),
        }));
  }, [payees]);

  const handleSearchChange = (value: string) => {
    table.setSearch(value);
    table.setCurrentPage(1);
  };

  const handleView = (payee: Payee) => {
    router.push(`/payees/${payee.id}`);
  };

  const handleEdit = (payee: Payee) => {
    router.push(`/payees/${payee.id}/edit`);
  };

  const handleDelete = async () => {
    if (!payeeToDelete) return;

    try {
      setIsDeleting(true);

      const response = await fetch(
        `/api/payees/${payeeToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete payee");
      }

      setPayees((prev) =>
        prev.filter(
          (payee) => payee.id !== payeeToDelete.id
        )
      );

      setPayeeToDelete(null);

      toast.success("Payee deleted.");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to delete payee.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePayeeTypeChange = (value: string) => {
    setPayeeType(value);
    table.setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setPayeeType("");
    table.setSearch("");
    table.setCurrentPage(1);
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 px-6 pt-6 pb-4">
        <h1 className="mb-6 text-2xl font-bold">
          Payees
        </h1>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-6 pb-6">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          
          <DataTableToolbar
            search={table.search}
            onSearchChange={handleSearchChange}
            onClearFilters={handleClearFilters}
            filters={
              <DataTableFilter
                value={payeeType}
                onChange={handlePayeeTypeChange}
                placeholder="Payee Type"
                options={payeeTypeOptions}
              />
            }
            actions={
              <Link
                href="/payees/new"
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
              >
                <Plus size={16} strokeWidth={2} />
                Add Payee
              </Link>
            }
          />

          <DataTable
            data={table.paginatedData}
            columns={columns}
            rowKey="id"
            sortColumn={table.sortColumn as string}
            sortDirection={table.sortDirection}
            onSort={(column) =>
              table.handleSort(column as keyof Payee)
            }
            onEdit={handleEdit}
            onDelete={(payee) =>
              setPayeeToDelete(payee)
            }
            onView={handleView}
          />

          <DataTablePagination
            currentPage={table.currentPage}
            totalPages={table.totalPages}
            onPageChange={table.setCurrentPage}
          />
        </div>

        <ConfirmDialogue
          open={payeeToDelete !== null}
          title="Delete Payee"
          message={
            payeeToDelete
              ? `Are you sure you want to delete "${payeeToDelete.name}"? This action cannot be undone.`
              : ""
          }
          loading={isDeleting}
          onCancel={() => setPayeeToDelete(null)}
          onConfirm={handleDelete}
        />
      </div>
    </div>
  );
}