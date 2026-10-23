"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import LoadingSpinner from "@/components/loading_spinner";

interface Payment {
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

interface Allocation {
  id: number;
  invoice_id: number;
  amount: number;
  invoice_number: number;
  invoice_date: string;
  invoice_total: number;
}

interface PaymentResponse {
  payment: Payment;
  allocations: Allocation[];
}

export default function PaymentDetailPage() {
  const params = useParams();
  const router = useRouter();

  const paymentNumber = params.payment_number as string;

  const [data, setData] = useState<PaymentResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayment = async () => {
      try {
        const response = await fetch(
          `/api/payments/${paymentNumber}`
        );

        if (!response.ok) {
          throw new Error("Payment not found.");
        }

        const result = await response.json();

        setData(result);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayment();
  }, [paymentNumber]);

  const formatCurrency = (value: number) => {
    return `Bds$${Number(value).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <p className="font-medium text-slate-800">
            Payment not found.
          </p>

          <button
            type="button"
            onClick={() => router.push("/payments")}
            className="mt-4 text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            Back to payments
          </button>
        </div>
      </div>
    );
  }

  const { payment, allocations } = data;

  return (
    <div className="p-6">
      {/* Header */}

      <div className="mb-6 flex items-start justify-between print:hidden">
        <div>
          <button
            type="button"
            onClick={() => router.push("/payments")}
            className="mb-3 text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            ← Payments
          </button>

          <h1 className="text-2xl font-bold text-slate-900">
            {payment.payment_number}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Customer payment
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Print
        </button>
      </div>

      {/* Payment information */}

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Customer
            </p>

            <p className="mt-1 font-medium text-slate-900">
              {payment.customer_name}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Payment Date
            </p>

            <p className="mt-1 font-medium text-slate-900">
              {new Date(payment.payment_date).toLocaleDateString()}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Payment Method
            </p>

            <p className="mt-1 font-medium text-slate-900">
              {payment.payment_method}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Total Payment
            </p>

            <p className="mt-1 text-lg font-semibold text-emerald-700">
              {formatCurrency(payment.total_amount)}
            </p>
          </div>
        </div>

        {(payment.reference || payment.memo) && (
          <div className="mt-6 grid grid-cols-1 gap-6 border-t border-slate-200 pt-6 md:grid-cols-2">
            {payment.reference && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Reference
                </p>

                <p className="mt-1 text-sm text-slate-800">
                  {payment.reference}
                </p>
              </div>
            )}

            {payment.memo && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Memo
                </p>

                <p className="mt-1 text-sm text-slate-800">
                  {payment.memo}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Allocations */}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-900">
            Payment Allocations
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Invoices that this payment was applied to.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left">
                <th className="px-5 py-3 font-medium text-slate-600">
                  Invoice
                </th>

                <th className="px-5 py-3 font-medium text-slate-600">
                  Invoice Date
                </th>

                <th className="px-5 py-3 text-right font-medium text-slate-600">
                  Invoice Total
                </th>

                <th className="px-5 py-3 text-right font-medium text-slate-600">
                  Payment Applied
                </th>
              </tr>
            </thead>

            <tbody>
              {allocations.map((allocation) => (
                <tr
                  key={allocation.id}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/invoices/${allocation.invoice_number}`
                        )
                      }
                      className="font-medium text-emerald-700 hover:text-emerald-800 hover:underline"
                    >
                      #{allocation.invoice_number}
                    </button>
                  </td>

                  <td className="px-5 py-4 text-slate-600">
                    {new Date(allocation.invoice_date).toLocaleDateString()}
                  </td>

                  <td className="px-5 py-4 text-right text-slate-700">
                    {formatCurrency(
                      allocation.invoice_total
                    )}
                  </td>

                  <td className="px-5 py-4 text-right font-medium text-slate-900">
                    {formatCurrency(allocation.amount)}
                  </td>
                </tr>
              ))}
            </tbody>

            <tfoot>
              <tr className="border-t border-slate-200 bg-slate-50">
                <td
                  colSpan={3}
                  className="px-5 py-4 text-right font-semibold text-slate-700"
                >
                  Total Applied
                </td>

                <td className="px-5 py-4 text-right text-lg font-semibold text-emerald-700">
                  {formatCurrency(
                    allocations.reduce(
                      (sum, allocation) =>
                        sum + Number(allocation.amount),
                      0
                    )
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}