"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/loading_spinner";
import DataTable from "@/components/data-table/data_table";
import DataTableToolbar from "@/components/data-table/data_table_toolbar";
import DataTablePagination from "@/components/data-table/data_table_pagination";
import { useDataTable } from "@/app/hooks/use_data_table";
import { Column } from "@/components/data-table/types";
import { Plus } from "lucide-react";
import DataTableSearchFilter from "@/components/data-table/data_table_search_filter";

interface PaymentData {
  id: number;
  payment_number: string;
  customer_id: number;
  customer_name: string;
  payment_date: string;
  payment_method: string;
  total_amount: number;
  reference: string | null;
  memo: string | null;
  created_at: string;
}

export default function PaymentsPage() {
  const router = useRouter();

  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerId, setCustomerId] = useState("");
  const filters = useMemo(
    () => [
      {
        key: "customer_id" as keyof PaymentData,
        value: customerId,
      }
    ],
    [customerId]
  );

  const table = useDataTable(
    payments,
    20,
    [
      "payment_number",
      "customer_name",
      "payment_method",
      "reference",
    ],
    filters
  );

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await fetch("/api/payments");

        if (!response.ok) {
          throw new Error("Failed to fetch payments.");
        }

        const data = await response.json();

        setPayments(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  const customerOptions = useMemo(() => {
    const uniqueCustomers = new Map<string, string>();

    payments.forEach((invoice: any) => {
      if (invoice.customer_id && invoice.customer_name) {
        uniqueCustomers.set(
          String(invoice.customer_id),
          invoice.customer_name
        );
      }
    });

    return Array.from(uniqueCustomers.entries())
      .map(([value, label]) => ({
        value,
        label,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [payments]);

  const handleSearchChange = (value: string) => {
    table.setSearch(value);
    table.setCurrentPage(1);
  };

  const handleCustomerChange = (value: string) => {
    setCustomerId(value);
    table.setCurrentPage(1);
  };

  const handleView = (payment: PaymentData) => {
    router.push(`/payments/${payment.payment_number}`);
  };

  const handleClearFilters = () => {
    setCustomerId("");
    table.setSearch("");
  }

  const columns: Column<PaymentData>[] = [
    {
      key: "payment_number",
      header: "Payment",
      sortable: true,
    },
    {
      key: "payment_date",
      header: "Date",
      sortable: true,
      render: (payment: PaymentData) => (
        <span>
          {new Date(payment.payment_date).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "customer_name",
      header: "Customer",
      sortable: true,
    },
    {
      key: "payment_method",
      header: "Method",
      sortable: true,
    },
    {
      key: "total_amount",
      header: "Amount",
      sortable: true,
      render: (payment: PaymentData) => (
        <span>
          ${Number(payment.total_amount).toFixed(2)}
        </span>
      ),
    },
    {
      key: "reference",
      header: "Reference",
    },
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Payments
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View customer payments received by GreenOffice.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <DataTableToolbar 
          search={table.search} 
          onClearFilters={handleClearFilters}
          onSearchChange={handleSearchChange}
          filters={
            <>
              <DataTableSearchFilter
                value={customerId}
                onChange={handleCustomerChange}
                options={customerOptions}
                placeholder="Customer"
                searchPlaceholder="Search customers..."
              />
            </>  
          }
          actions={
            <Link
              href="/payments/receive"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-md font-medium text-white transition hover:bg-emerald-700"
            >
              <Plus size={16} strokeWidth={2} />
              Receive Payment
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
            table.handleSort(column as keyof PaymentData)
          }
          onView={handleView}
        />

        <DataTablePagination
          currentPage={table.currentPage}
          totalPages={table.totalPages}
          onPageChange={table.setCurrentPage}
        />
      </div>
    </div>
  );
}