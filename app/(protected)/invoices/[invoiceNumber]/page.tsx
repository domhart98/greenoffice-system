

import pool from "@/lib/db";
import InvoicePreview from "@/components/invoice_preview";
import Link from "next/link";
import InvoiceActions from "@/components/invoice_actions";

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ invoiceNumber: string }>;
}) {
  const { invoiceNumber } = await params;

  const [invoiceRows] = await pool.query(
    `
    SELECT *
    FROM invoices
    WHERE invoice_number = ?

    `,
    [invoiceNumber]
  );

  const invoice = (invoiceRows as any[])[0];

  if (!invoice) {
    return (
      <div>
        <h1 className="p-6">
          Invoice not found
        </h1>
        <button
            className="mt-4 text-emerald-600 hover:text-emerald-700"
        >
          ← Go back
        </button>
      </div>
      
    );
  }

  const [customerRows] = await pool.query(
    `
    SELECT *
    FROM customers
    WHERE id = ?
    `,
    [invoice.customer_id]
  );

  const customer = (customerRows as any[])[0];

  const [itemRows] = await pool.query(
    `
    SELECT *
    FROM invoice_items
    WHERE invoice_id = ?
    `,
    [invoice.id]
  );

  const items = itemRows as any[];

  const [paymentRows] = await pool.query(
    `
    SELECT
      p.id,
      p.payment_number,
      p.payment_date,
      p.payment_method,
      p.reference,
      p.memo,
      pa.amount
    FROM payment_allocations pa
    INNER JOIN payments p
      ON p.id = pa.payment_id
    WHERE pa.invoice_id = ?
    ORDER BY p.payment_date ASC, p.id ASC
    `,
    [invoice.id]
  );

  const payments = paymentRows as any[];

  const invoiceData = {
    id: invoice.id,
    invoice_number: invoice.invoice_number,
    customer_name: invoice.customer_name,
    customer_address: invoice.customer_address,
    customer_email: invoice.customer_email,
    customer_phone: invoice.customer_phone,
    customer_id: invoice.customer_id,
    customer_state: customer.state,
    customer_country: customer.country,
    customer_postcode: customer.postal_code,
    customer_city: customer.city,
    customer_balance: customer.open_balance,
    customer_companyname: customer.company_name,
    invoice_date: invoice.invoice_date,
    due_date: invoice.due_date,
    terms: invoice.terms,
    status: invoice.status,
    subtotal: invoice.subtotal,
    vat: invoice.vat,
    total: invoice.total,
    open_balance: invoice.open_balance,

    items: items.map(item => ({
      id: item.id,
      invoice_id: item.invoice_id,
      line_number: item.line_number,
      product_id: item.product_id,
      quantity: item.quantity,
      product_name: item.product_name,
      description: item.description,
      product_price: item.product_price,
      subtotal: item.subtotal,
      vat_rate: item.vat_rate,
      vat_total: item.vat_total,
      total:item.total,
    })),

    payments: payments.map((payment) => ({
      id: payment.id,
      payment_number: payment.payment_number,
      payment_date: payment.payment_date,
      payment_method: payment.payment_method,
      reference: payment.reference,
      memo: payment.memo,
      amount: payment.amount,
    })),
  };

  console.log(JSON.stringify(itemRows, null, 2));
  console.log({
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoice_number,
  });
  console.log(JSON.stringify(invoiceData, null, 2));

  return (
    <div className="w-full mx-auto">

      <div className="invoice-page-grid grid grid-cols-1 items-start gap-8 p-4 lg:p-8 xl:grid-cols-[794px_minmax(0,1fr)]">
        
        {/* Left Column - Invoice Preview*/}
        <div className="invoice-print-preview w-full min-w-0">
          <InvoicePreview invoice={invoiceData}/>
        </div>

        {/* Right Column - Management */}
        <div className="flex min-w-0 flex-col gap-8 xl:sticky xl:top-8 xl:self-start">


          <div className="grid grid-cols-2 gap-6">
            

            
          </div>

          {/* Invoice Actions */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm print:hidden">
            <InvoiceActions
              invoiceId={invoice.id}
              invoiceNumber={invoice.invoice_number}
              customerId={invoice.customer_id}
              status={invoice.status}
            />
          </div>

          {/* Outstanding Balance */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm print:hidden">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Payment Summary
            </h3>

            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-600">Invoice Total</span>
                <span className="font-medium tabular-nums text-slate-900">
                  ${Number(invoice.total).toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-600">Amount Paid</span>
                <span className="font-medium tabular-nums text-slate-900">
                  $
                  {(
                    Number(invoice.total) - Number(invoice.open_balance)
                  ).toFixed(2)}
                </span>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-semibold text-slate-800">
                    Outstanding Balance
                  </span>

                  <span className="text-xl font-bold tabular-nums text-emerald-700">
                    ${Number(invoice.open_balance).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm print:hidden">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold">
                Payment History
              </h2>
            </div>

            {payments.length === 0 ? (
              <div className="px-6 py-8 text-sm text-slate-500">
                No payments have been applied to this invoice.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      Payment #
                    </th>

                    <th className="px-6 py-3 text-left">
                      Date
                    </th>

                    <th className="px-6 py-3 text-right">
                      Amount
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="px-6 py-4">
                        <Link
                          href={`/payments/${payment.payment_number}`}
                          className="font-medium text-emerald-600 hover:text-emerald-700"
                        >
                          {payment.payment_number}
                        </Link>
                      </td>

                      <td className="px-6 py-4">
                        {new Date(
                          payment.payment_date
                        ).toLocaleDateString()}
                      </td>

                      <td className="px-6 py-4 text-right font-medium">
                        ${Number(payment.amount).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        
      </div>
    </div>
      
  );
}