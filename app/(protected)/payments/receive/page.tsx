"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import DataTableSearchFilter from "@/components/data-table/data_table_search_filter";
import LoadingSpinner from "@/components/loading_spinner";

interface Customer {
  id: number;
  name: string;
}

interface OutstandingInvoice {
  id: number;
  invoice_number: number;
  invoice_date: string;
  due_date: string | null;
  terms: string | null;
  total: number;
  open_balance: number;
  status: "UNPAID" | "PARTIAL";
}

interface PaymentAmount {
  [invoiceId: number]: string;
}

export default function ReceivePaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState("");

  const [invoices, setInvoices] = useState<OutstandingInvoice[]>([]);
  const [paymentAmounts, setPaymentAmounts] =
    useState<PaymentAmount>({});

  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [reference, setReference] = useState("");
  const [memo, setMemo] = useState("");

  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  /*
   * --------------------------------------------------
   * Load customers
   * --------------------------------------------------
   */

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch("/api/customers");

        if (!response.ok) {
          throw new Error("Failed to fetch customers.");
        }

        const data = await response.json();

        setCustomers(
          data.map((customer: any) => ({
            id: customer.id,
            name: customer.name,
          }))
        );
      } catch (error) {
        console.error(error);
        toast.error("Failed to load customers.");
      } finally {
        setLoadingCustomers(false);
      }
    };

    fetchCustomers();
  }, []);

  /*
   * --------------------------------------------------
   * Load outstanding invoices
   * --------------------------------------------------
   */

  useEffect(() => {
    const customerIdFromUrl = searchParams.get("customer_id");

    if (customerIdFromUrl) {
      setCustomerId(customerIdFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!customerId) {
      setInvoices([]);
      setPaymentAmounts({});
      return;
    }

    const fetchInvoices = async () => {
      try {
        setLoadingInvoices(true);

        const response = await fetch(
          `/api/payments/outstanding?customer_id=${customerId}`
        );

        if (!response.ok) {
          throw new Error(
            "Failed to fetch outstanding invoices."
          );
        }

        const data = await response.json();

        setInvoices(data);
        setPaymentAmounts({});
  
      } catch (error) {
        console.error(error);
        toast.error(
          "Failed to load outstanding invoices."
        );
      } finally {
        setLoadingInvoices(false);
      }
    };

    fetchInvoices();
  }, [customerId]);

  /*
   * --------------------------------------------------
   * Update payment amount
   * --------------------------------------------------
   */

  const handleAmountChange = (
    invoiceId: number,
    value: string
  ) => {
    setPaymentAmounts((prev) => ({
      ...prev,
      [invoiceId]: value,
    }));
  };

  /*
   * --------------------------------------------------
   * Calculate total payment
   * --------------------------------------------------
   */

  const totalPayment = useMemo(() => {
    return invoices.reduce((sum, invoice) => {
      const amount = Number(
        paymentAmounts[invoice.id] || 0
      );

      return sum + (Number.isFinite(amount) ? amount : 0);
    }, 0);
  }, [invoices, paymentAmounts]);

  /*
   * --------------------------------------------------
   * Format currency
   * --------------------------------------------------
   */

  const formatCurrency = (value: number) => {
    return `Bds$${value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  /*
   * --------------------------------------------------
   * Format date
   * --------------------------------------------------
   */

  const formatDate = (date: string | null) => {
    if (!date) return "—";

    const [year, month, day] = date.split("-");

    return `${month}/${day}/${year}`;
  };

  /*
   * --------------------------------------------------
   * Customer options
   * --------------------------------------------------
   */

  const customerOptions = customers.map((customer) => ({
    value: String(customer.id),
    label: customer.name,
  }));

  const handleReceivePayment = async () => {
    if (!customerId) {
        toast.error("Please select a customer.");
        return;
    }

    if (totalPayment <= 0) {
        toast.error("Enter a payment amount.");
        return;
    }

    const allocations = invoices
        .map((invoice) => ({
        invoice_id: invoice.id,
        amount: Number(paymentAmounts[invoice.id] || 0),
        }))
        .filter((allocation) => allocation.amount > 0);

    const hasInvalidAmount = allocations.some((allocation) => {
        const invoice = invoices.find(
        (invoice) => invoice.id === allocation.invoice_id
        );

        return (
        !invoice ||
        allocation.amount > Number(invoice.open_balance)
        );
    });

    if (hasInvalidAmount) {
        toast.error("One or more payment amounts exceed the invoice balance.");
        return;
    }

    try {
        setIsSubmitting(true);

        const response = await fetch("/api/payments", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            customer_id: Number(customerId),
            payment_date: paymentDate,
            payment_method: paymentMethod,
            reference: reference || undefined,
            memo: memo || undefined,
            allocations,
        }),
        });

        const data = await response.json();

        if (!response.ok) {
        throw new Error(
            data.error || "Failed to receive payment."
        );
        }

        toast.success(
        `Payment ${data.payment_number} recorded successfully.`
        );

        router.push("/payments");
    } catch (error) {
        console.error(error);

        toast.error(
        error instanceof Error
            ? error.message
            : "Failed to receive payment."
        );
    } finally {
        setIsSubmitting(false);
    }
  };

  /*
   * --------------------------------------------------
   * Loading state
   * --------------------------------------------------
   */

  if (loadingCustomers) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Receive Payment
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Record a customer payment against one or more
          outstanding invoices.
        </p>
      </div>

      <div className="max-w-6xl space-y-6">

        {/* -------------------------------------------- */}
        {/* Payment details */}
        {/* -------------------------------------------- */}

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-slate-900">
            Payment Details
          </h2>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

            {/* Customer */}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Customer
              </label>

              <DataTableSearchFilter
                value={customerId}
                onChange={(value) => {
                  setCustomerId(value);
                }}
                options={customerOptions}
                placeholder="Select customer"
                searchPlaceholder="Search customers..."
              />
            </div>

            {/* Payment date */}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Payment Date
              </label>

              <input
                type="date"
                value={paymentDate}
                onChange={(e) =>
                  setPaymentDate(e.target.value)
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              />
            </div>

            {/* Payment method */}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Payment Method
              </label>

              <select
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(e.target.value)
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              >
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
                <option value="Bank Transfer">
                  Bank Transfer
                </option>
                <option value="Credit Card">
                  Credit Card
                </option>
                <option value="Debit Card">
                  Debit Card
                </option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Reference */}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Reference
              </label>

              <input
                type="text"
                value={reference}
                onChange={(e) =>
                  setReference(e.target.value)
                }
                placeholder="Cheque number, transfer reference, etc."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              />
            </div>
          </div>
        </div>

        {/* -------------------------------------------- */}
        {/* Outstanding invoices */}
        {/* -------------------------------------------- */}

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-900">
              Outstanding Invoices
            </h2>
          </div>

          {!customerId ? (
            <div className="p-10 text-center">
              <p className="text-sm text-slate-500">
                Select a customer to view outstanding
                invoices.
              </p>
            </div>
          ) : loadingInvoices ? (
            <div className="p-10 text-center">
              <LoadingSpinner />
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm font-medium text-slate-700">
                No outstanding invoices
              </p>

              <p className="mt-1 text-sm text-slate-500">
                This customer has no unpaid or partially
                paid invoices.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left">
                    <th className="px-5 py-3 font-medium text-slate-600">
                      Invoice
                    </th>

                    <th className="px-5 py-3 font-medium text-slate-600">
                      Date
                    </th>

                    <th className="px-5 py-3 font-medium text-slate-600">
                      Due Date
                    </th>

                    <th className="px-5 py-3 text-right font-medium text-slate-600">
                      Total
                    </th>

                    <th className="px-5 py-3 text-right font-medium text-slate-600">
                      Balance
                    </th>

                    <th className="px-5 py-3 text-right font-medium text-slate-600">
                      Payment
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {invoices.map((invoice) => {
                    const amount = Number(
                      paymentAmounts[invoice.id] || 0
                    );

                    const exceedsBalance =
                      amount >
                      Number(invoice.open_balance);

                    return (
                      <tr
                        key={invoice.id}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="px-5 py-4 font-medium text-slate-900">
                          #{invoice.invoice_number}
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {formatDate(
                            invoice.invoice_date
                          )}
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {formatDate(invoice.due_date)}
                        </td>

                        <td className="px-5 py-4 text-right text-slate-700">
                          {formatCurrency(
                            Number(invoice.total)
                          )}
                        </td>

                        <td className="px-5 py-4 text-right font-medium text-slate-900">
                          {formatCurrency(
                            Number(invoice.open_balance)
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div className="ml-auto max-w-36">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={
                                paymentAmounts[
                                  invoice.id
                                ] ?? ""
                              }
                              onChange={(e) =>
                                handleAmountChange(
                                  invoice.id,
                                  e.target.value
                                )
                              }
                              placeholder="0.00"
                              className={`w-full rounded-lg border px-3 py-2 text-right text-sm outline-none transition focus:ring-4 ${
                                exceedsBalance
                                  ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
                                  : "border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/10"
                              }`}
                            />

                            {exceedsBalance && (
                              <p className="mt-1 text-xs text-red-500">
                                Exceeds balance
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* Total */}

                <tfoot>
                  <tr className="border-t border-slate-200 bg-slate-50">
                    <td
                      colSpan={5}
                      className="px-5 py-4 text-right font-semibold text-slate-700"
                    >
                      Total Payment
                    </td>

                    <td className="px-5 py-4 text-right text-lg font-semibold text-emerald-700">
                      {formatCurrency(totalPayment)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* -------------------------------------------- */}
        {/* Memo */}
        {/* -------------------------------------------- */}

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Memo
          </label>

          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            rows={3}
            placeholder="Optional notes about this payment..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
          />
        </div>

        {/* -------------------------------------------- */}
        {/* Actions */}
        {/* -------------------------------------------- */}

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleReceivePayment}
            disabled={
              isSubmitting ||
              !customerId ||
              totalPayment <= 0 ||
              invoices.some(
                (invoice) =>
                  Number(
                    paymentAmounts[invoice.id] || 0
                  ) > Number(invoice.open_balance)
              )
            }
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Logging Payment..." : "Receive Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}