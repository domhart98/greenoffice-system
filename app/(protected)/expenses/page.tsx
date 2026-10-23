"use client";

import DataTable from "@/components/data-table/data_table";
import DataTableToolbar from "@/components/data-table/data_table_toolbar";
import DataTablePagination from "@/components/data-table/data_table_pagination";
import { useDataTable } from "@/app/hooks/use_data_table";
import { Column } from "@/components/data-table/types";
import LoadingSpinner from "@/components/loading_spinner";
import { ExoticComponent, useEffect, useMemo, useState } from "react";
import { ExpenseData } from "@/types/expense";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ConfirmDialogue from "@/components/ui/confirm_dialogue";
import toast from "react-hot-toast";
import { stringify } from "querystring";
import { Plus, PlusCircle } from "lucide-react";
import DataTableSearchFilter from "@/components/data-table/data_table_search_filter";
import DataTableFilter from "@/components/data-table/data_table_filter";
import DataTableDateFilter from "@/components/data-table/data_table_date_filter";

export default function ExpensesPage() {
  
  const router = useRouter();
  const [expenses, setExpenses] = useState<ExpenseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [payeeId, setPayeeId] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [status, setStatus] = useState("");
  const [expenseToDelete, setExpenseToDelete] = useState<ExpenseData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const filters = useMemo(
    () => [
      {
        key: "payee_id" as keyof ExpenseData,
        value: payeeId,
      },
      {
        key: "status" as keyof ExpenseData,
        value: status,
      },
    ],
    [payeeId, status]
  );
  const dateFilter = useMemo(
    () => ({
      key: "expense_date" as keyof ExpenseData,
      value: dateRange,
      customStartDate,
      customEndDate,
    }),
    [dateRange, customStartDate, customEndDate]
  );
  const table = useDataTable(
    expenses, 
    20,
    [
      "expense_number",
      "payee_name",
    ],
    filters,
    dateFilter
  );

  const columns: Column<(typeof expenses)[number]>[] = [
    {
      key: "expense_number",
      header: "Expense #"
    },
    {
      key: "expense_date",
      header: "Date",
      sortable: true,
      render: (expense: ExpenseData) => (
        <span>
          {new Date(expense.expense_date).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "payee_name",
      header: "Payee",
      sortable: true,
    },
    {
      key: "payment_method",
      header: "Payment Method"
    },
    {
      key: "status",
      header: "Status"
    },
    {
      key: "subtotal",
      header: "Subtotal",
      render: (expense: ExpenseData) => (
        <span>
          ${Number(expense.subtotal).toFixed(2)}
        </span>
      ),
    },
    {
      key: "vat_total",
      header: "Vat",
      render: (expense: ExpenseData) => (
        <span>
          ${Number(expense.vat_total).toFixed(2)}
        </span>
      ),
    },
    {
      key: "total",
      header: "Total",
      render: (expense: ExpenseData) => (
        <span>
          ${Number(expense.total).toFixed(2)}
        </span>
      ),
    }
  ];

  const payeeOptions = useMemo(() => {
    const uniquePayees = new Map<string, string>();

    expenses.forEach((expense: any) => {
      if (expense.payee_id && expense.payee_name) {
        uniquePayees.set(
          String(expense.payee_id),
          expense.payee_name
        );
      }
    });

    return Array.from(uniquePayees.entries())
      .map(([value, label]) => ({
        value,
        label,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [expenses]);

  const statusOptions = useMemo(() => {
    const values = expenses
      .map((expense: ExpenseData) => expense.status)
      .filter(Boolean);

    return [...new Set(values)]
      .sort()
      .map((value) => ({
        value: String(value),
        label: String(value),
      }));
  }, [expenses]);

  useEffect(() => {
    const fetchExpenses = async () => {
        const response = await fetch(
            `/api/expenses`
        );

        const data = await response.json();

        setExpenses(data);
        setLoading(false);
    };

    fetchExpenses();
  }, []);

  const handleSearchChange = (value: string) => {
    table.setSearch(value);
    table.setCurrentPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    table.setCurrentPage(1);
  };

  const handlePayeeChange = (value: string) => {
    setPayeeId(value);
    table.setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setStatus("");
    setPayeeId("");
    setCustomEndDate("");
    setCustomStartDate("");
    setDateRange("");
    table.setSearch("");
    table.setCurrentPage(1);
  };

  const handleDateRangeChange = (value: string) => {
    setDateRange(value);

    if (value !== "custom") {
      setCustomStartDate("");
      setCustomEndDate("");
    }

    table.setCurrentPage(1);
  };

  const handleCustomDateRangeChange = (startDate: string, endDate: string) => {
    setCustomStartDate(startDate);
    setCustomEndDate(endDate);
    table.setCurrentPage(1);
  }

  const handleView = (expense: ExpenseData) => {
    router.push(`/expenses/${expense.id}`);
  };

  const handleEdit = (expense: ExpenseData) => {
    router.push(`/expenses/${expense.id}/edit`);
  };

  const handleDelete = async () => {
    try{
      setIsDeleting(true);

      await fetch(`/api/expenses/${expenseToDelete!.id}`, {
        method: "DELETE",
      });

      setExpenses((prev) =>
        prev.filter(
          (expense:any) => expense.id !== expenseToDelete!.id
        )
      );

      setExpenseToDelete(null);
      setIsDeleting(false);

    } catch (error) {
      console.log(error);
      toast.error("Failed to Delete Expense.");
    }  
  }; 

  if (loading) {
    return <LoadingSpinner/>;
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 px-6 pt-6 pb-4">
        <h1 className="text-2xl font-bold mb-6">
          Expenses
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
                <DataTableSearchFilter
                  value={payeeId}
                  onChange={handlePayeeChange}
                  options={payeeOptions}
                  placeholder="Payee"
                  searchPlaceholder="Search payees..."
                />
                <DataTableFilter
                  value={status}
                  onChange={handleStatusChange}
                  placeholder="Status"
                  options={statusOptions}
                />
                <DataTableDateFilter
                  value={dateRange}
                  onChange={handleDateRangeChange}
                  customStartDate={customStartDate}
                  customEndDate={customEndDate}
                  onCustomDateChange={handleCustomDateRangeChange}
                />
              </>
            }
            actions={
              <Link href="/expenses/new"
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-md font-medium text-white transition hover:bg-emerald-700">
                <Plus size={16} strokeWidth={2} />
                Add Expense
              </Link>
            }
          />
          
          <DataTable data={table.paginatedData} 
                    columns={columns} 
                    rowKey={"id"} 
                    sortColumn={table.sortColumn as string} 
                    sortDirection={table.sortDirection} 
                    onSort={(column) => table.handleSort(column as keyof ExpenseData)} 
                    onEdit={handleEdit} 
                    onDelete={(expense) => setExpenseToDelete(expense)}
                    onView={handleView} />
    
          <DataTablePagination currentPage={table.currentPage} totalPages={table.totalPages} onPageChange={table.setCurrentPage}/>
        </div>
        

        <ConfirmDialogue
            open={expenseToDelete !== null}
            title="Delete Expense"
            message={
                expenseToDelete
                    ? `Are you sure you want to delete "${expenseToDelete.expense_number}"? This action cannot be undone.`
                    : ""
            }
            loading={isDeleting}
            onCancel={() => setExpenseToDelete(null)}
            onConfirm={handleDelete}
        />
      </div>
    </div>
  );
}