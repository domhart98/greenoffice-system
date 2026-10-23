
"use client";

import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Pencil,
  CheckCircle,
  Printer,
  FileDown,
  CreditCard,
  Ban,
} from "lucide-react";

type Props = {
  invoiceId: number;
  invoiceNumber: number;
  customerId: number | null;
  status: string;
};

export default function InvoiceActions({
  invoiceId,
  invoiceNumber,
  customerId,
  status,
}: Props) {
  const router = useRouter();

  const handleIssue = async () => {
    const confirmed = window.confirm(
      `Confirm and issue invoice #${invoiceNumber}?\n\n` +
        "This will deduct inventory and mark the invoice as UNPAID."
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/invoices/${invoiceId}/issue`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to issue invoice.");
      }

      toast.success(`Invoice #${invoiceNumber} has been issued.`);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to issue invoice."
      );
    }
  };

  const handleVoid = async () => {
    const confirmed = window.confirm(
      `Void invoice #${invoiceNumber}?\n\n` +
        "This will cancel the invoice and restore inventory."
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `/api/invoices/${invoiceNumber}/void`,
        { method: "POST" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to void invoice.");
      }

      toast.success(`Invoice #${invoiceNumber} has been voided.`);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to void invoice."
      );
    }
  };

  const handleDownload = () => {
    router.push(`/api/invoices/${invoiceNumber}/pdf`);
  };

  const handleReceive = () => {
    if (customerId == null) {
      toast.error("This invoice has no customer assigned.");
      return;
    }

    router.push(`/payments/receive?customer_id=${customerId}`);
  };

  const buttonBase =
    "flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";

  const secondaryButton =
    `${buttonBase} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-400`;

  const primaryButton =
    `${buttonBase} bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500`;

  const dangerButton =
    `${buttonBase} border border-red-200 bg-white text-red-600 hover:bg-red-50 focus:ring-red-500`;

  return (
    <div className="flex flex-col gap-3">
      {/* Back navigation */}
      <button
        type="button"
        onClick={() => router.push("/invoices")}
        className={`${secondaryButton} justify-start`}
      >
        <ArrowLeft size={16} />
        Back to Invoices
      </button>

      <div className="my-1 border-t border-slate-100" />

      {status === "DRAFT" && (
        <>
          <button
            type="button"
            onClick={() => router.push(`/invoices/${invoiceNumber}/edit`)}
            className={secondaryButton}
          >
            <Pencil size={16} />
            Edit Invoice
          </button>

          <button
            type="button"
            onClick={handleIssue}
            className={primaryButton}
          >
            <CheckCircle size={16} />
            Confirm & Issue
          </button>
        </>
      )}

      {(status === "UNPAID" || status === "PARTIAL") && (
        <>
          {status === "UNPAID" && (
            <button
              type="button"
              onClick={() => router.push(`/invoices/${invoiceNumber}/edit`)}
              className={secondaryButton}
            >
              <Pencil size={16} />
              Edit Invoice
            </button>
          )}

          <button
            type="button"
            onClick={handleReceive}
            className={primaryButton}
          >
            <CreditCard size={16} />
            Receive Payment
          </button>

          {status === "UNPAID" && (
            <button
              type="button"
              onClick={handleVoid}
              className={dangerButton}
            >
              <Ban size={16} />
              Void Invoice
            </button>
          )}
        </>
      )}

      <button
        type="button"
        onClick={() => window.print()}
        className={secondaryButton}
      >
        <Printer size={16} />
        Print Invoice
      </button>

      <button
        type="button"
        onClick={handleDownload}
        className={secondaryButton}
      >
        <FileDown size={16} />
        Download PDF
      </button>
    </div>
  );
}
