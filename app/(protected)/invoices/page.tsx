"use client";

import DataTable from "@/components/data-table/data_table";
import DataTableToolbar from "@/components/data-table/data_table_toolbar";
import DataTablePagination from "@/components/data-table/data_table_pagination";
import DataTableSearchFilter from "@/components/data-table/data_table_search_filter";
import DataTableDateFilter from "@/components/data-table/data_table_date_filter";
import { useDataTable } from "@/app/hooks/use_data_table";
import { Column } from "@/components/data-table/types";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import InvoiceStatusBadge from "@/components/invoice_status_badge";
import LoadingSpinner from "@/components/loading_spinner";
import { useRouter } from "next/navigation";
import ConfirmDialogue from "@/components/ui/confirm_dialogue";
import toast from "react-hot-toast";
import { stringify } from "querystring";
import { InvoiceData } from "@/types/invoice";
import DataTableFilter from "@/components/data-table/data_table_filter";
import { FilePen, Clock, CircleDollarSign, CircleCheck, CircleX, PlusCircle, Plus } from "lucide-react";

export default function InvoicesPage() {

  const router = useRouter();
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [invoiceToDelete, setinvoiceToDelete] = useState<InvoiceData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const filters = useMemo(
    () => [
      {
        key: "customer_id" as keyof InvoiceData,
        value: customerId,
      },
      {
        key: "status" as keyof InvoiceData,
        value: status,
      },
    ],
    [customerId, status]
  );
  const dateFilter = useMemo(
    () => ({
      key: "invoice_date" as keyof InvoiceData,
      value: dateRange,
      customStartDate,
      customEndDate,
    }),
    [dateRange, customStartDate, customEndDate]
  );
  const table = useDataTable(
    invoices, 
    20,
    [
      "invoice_number",
      "customer_name",
    ],
    filters,
    dateFilter
  );
  const invoiceStatusStyles = {
    DRAFT: {
      label: "Draft",
      icon: FilePen,
      className: "bg-slate-100 text-slate-700 border-slate-200",
    },
    UNPAID: {
      label: "Unpaid",
      icon: Clock,
      className: "bg-amber-50 text-amber-700 border-amber-200",
    },
    PARTIAL: {
      label: "Partial",
      icon: CircleDollarSign,
      className: "bg-blue-50 text-blue-700 border-blue-200",
    },
    PAID: {
      label: "Paid",
      icon: CircleCheck,
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    VOID: {
      label: "Void",
      icon: CircleX,
      className: "bg-red-50 text-red-700 border-red-200",
    },
  };

  const customerOptions = useMemo(() => {
    const uniqueCustomers = new Map<string, string>();

    invoices.forEach((invoice: any) => {
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
  }, [invoices]);

  const statusOptions = useMemo(() => {
    const values = invoices
      .map((invoice: InvoiceData) => invoice.status)
      .filter(Boolean);

    return [...new Set(values)]
      .sort()
      .map((value) => ({
        value: String(value),
        label: String(value),
      }));
  }, [invoices]);

  const columns: Column<InvoiceData>[] = [
    {
      key: "invoice_number",
      header: "Invoice #"
    },
    {
      key: "invoice_date",
      header: "Date",
      sortable: true,
      render: (invoice: InvoiceData) => (
        <span>
          {new Date(invoice.invoice_date).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "customer_name",
      header: "Customer"
    },
    {
      key: "total",
      header: "Total",
      render: (invoice: InvoiceData) => (
        <span>
          ${Number(invoice.total).toFixed(2)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (invoice) => {
        const invoiceStatus = invoice.status as keyof typeof invoiceStatusStyles;
        const status = invoiceStatusStyles[invoiceStatus];

        if (!status) {
          return;
        }

        const Icon = status.icon;

        return (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${status.className}`}
          >
            <Icon className="h-3.5 w-3.5" />
            {status.label}
          </span>
        );
      },
    }
  ];

  useEffect(() => {
    const fetchinvoices = async () => {
        const response = await fetch(
            `/api/invoices`
        );

        const data = await response.json();

        setInvoices(data);
        setLoading(false);
    };

    fetchinvoices();
  }, []);


  const handleSearchChange = (value: string) => {
    table.setSearch(value);
    table.setCurrentPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    table.setCurrentPage(1);
  };

  const handleCustomerChange = (value: string) => {
    setCustomerId(value);
    table.setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setStatus("");
    setCustomerId("");
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


  const handleView = (invoice: InvoiceData) => {
    router.push(`/invoices/${invoice.invoice_number}`);
  };

  const handleEdit = (invoice: InvoiceData) => {
      router.push(`/invoices/${invoice.invoice_number}/edit`);
  };

  const handleDelete = async () => {
    try{
      setIsDeleting(true);

      await fetch(`/api/invoices/${invoiceToDelete!.id}`, {
        method: "DELETE",
      });

      setInvoices((prev) =>
        prev.filter(
          (invoice:any) => invoice.id !== invoiceToDelete!.id
        )
      );

      setinvoiceToDelete(null);
      setIsDeleting(false);

    } catch (error) {
      console.log(error);
      toast.error("Failed to Delete invoice.");
    }  
  }; 

  const handleReceivePayment = (invoice: InvoiceData) => {
    router.push(
      `/payments/receive?customer_id=${invoice.customer_id}`
    );
  };

  const handleIssue = async (invoice: InvoiceData) => {
    if (invoice.status !== "DRAFT") return;

    const confirmed = window.confirm(
      `Confirm and issue invoice #${invoice.invoice_number}?\n\n` +
      `This will deduct inventory and mark the invoice as UNPAID.`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/invoices/${invoice.invoice_number}/issue`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to issue invoice.");
      }

      toast.success(
        `Invoice #${invoice.invoice_number} has been issued.`
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to issue invoice."
      );
    }
  };

  const handleVoid = async (invoice: InvoiceData) => {
    if (invoice.status !== "UNPAID") return;

    const confirmed = window.confirm(
      `Void invoice #${invoice.invoice_number}?\n\n` +
        `This will cancel the invoice, restore inventory, and set the outstanding balance to $0.`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `/api/invoices/${invoice.invoice_number}/void`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to void invoice.");
      }

      toast.success(
        `Invoice #${invoice.invoice_number} has been voided.`
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to void invoice."
      );
    }
  };

  const actions = (invoice: InvoiceData) => {
    switch (invoice.status) {
      case "DRAFT":
        return [
          {
            label: "View",
            onClick: handleView,
          },
          {
            label: "Edit",
            onClick: handleEdit,
          },
          {
            label: "Delete",
            onClick: (invoice: InvoiceData) => {
              setinvoiceToDelete(invoice);
            },
            variant: "danger" as const,
          },
          {
            label: "Confirm & Issue",
            onClick: handleIssue,
          },
        ];

      case "UNPAID":
        return [
          {
            label: "View",
            onClick: handleView,
          },
          {
            label: "Edit",
            onClick: handleEdit,
          },
          {
            label: "Receive Payment",
            onClick: handleReceivePayment,
          },
          {
            label: "Void",
            onClick: handleVoid,
            variant: "danger" as const,
          },
        ];

      case "PARTIAL":
        return [
          {
            label: "View",
            onClick: handleView,
          },
          {
            label: "Receive Payment",
            onClick: handleReceivePayment,
          },
        ];

      case "PAID":
        return [
          {
            label: "View",
            onClick: handleView,
          },
        ];

      case "VOID":
        return [
          {
            label: "View",
            onClick: handleView,
          },
        ];

      default:
        return [
          {
            label: "View",
            onClick: handleView,
          },
          {
            label: "Receive Payment",
            onClick: handleReceivePayment,
          },
        ];
    }
  };

  if (loading) {
    return <LoadingSpinner/>;
  }
   
  console.log("Customer Options: ", customerOptions, "\n\n\nColumns: ", columns,"\n\n\nInvoices:", invoices );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 px-6 pt-6 pb-4">
        <h1 className="text-2xl font-bold mb-6">
          Invoices
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
                  value={customerId}
                  onChange={handleCustomerChange}
                  options={customerOptions}
                  placeholder="Customer"
                  searchPlaceholder="Search customers..."
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
              <Link href="/invoices/new"
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-md font-medium text-white transition hover:bg-emerald-700">
                <Plus size={16} strokeWidth={2} />
                Add invoice
              </Link>
            }
          />
        
          <DataTable data={table.paginatedData} 
                    columns={columns} 
                    rowKey={"id"} 
                    sortColumn={table.sortColumn as string} 
                    sortDirection={table.sortDirection} 
                    onSort={(column) => table.handleSort(column as keyof InvoiceData)}  
                    actions={actions}/>
    
          <DataTablePagination currentPage={table.currentPage} totalPages={table.totalPages} onPageChange={table.setCurrentPage}></DataTablePagination>
        </div>
        

        <ConfirmDialogue
            open={invoiceToDelete !== null}
            title="Delete invoice"
            message={
                invoiceToDelete
                    ? `Are you sure you want to delete "${invoiceToDelete.invoice_number}"? This action cannot be undone.`
                    : ""
            }
            loading={isDeleting}
            onCancel={() => setinvoiceToDelete(null)}
            onConfirm={handleDelete}
        />
      </div>
    </div>
  );
}