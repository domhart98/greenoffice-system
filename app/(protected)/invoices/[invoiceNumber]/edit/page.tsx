import pool from "@/lib/db";
import InvoiceForm from "@/components/forms/invoice_form";
import { InvoiceData } from "@/types/invoice";

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ invoiceNumber: string }>;
}) {
  const { invoiceNumber } = await params;

  const [invoiceRows]: any = await pool.query(
  `
  SELECT
    i.*,

    c.state AS customer_state,
    c.city AS customer_city,
    c.country AS customer_country,
    c.postal_code AS customer_postal_code

  FROM invoices i

  LEFT JOIN customers c
    ON c.id = i.customer_id

  WHERE i.invoice_number = ?
  `,
  [invoiceNumber]
);

  const invoice  = (invoiceRows as any[])[0];

  if (!invoice) {
    return <div>Invoice not found</div>;
  }

  if (invoice.status !== "DRAFT") {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">
          Invoice cannot be edited
        </h1>

        <p className="text-gray-600">
          Only invoices in DRAFT status can be edited.
        </p>

        <p className="mt-2">
          Current status:
          <span className="font-bold ml-2">
            {invoice.status}
          </span>
        </p>
      </div>
    );
  }

  const [itemRows] = await pool.query(
    `
    SELECT
      ii.*,
      p.stock_quantity AS stock_quantity
    FROM invoice_items ii
    LEFT JOIN products p
      ON p.id = ii.product_id
    WHERE ii.invoice_id = ?
    ORDER BY ii.line_number ASC
    `,
    [invoice.id]
  );

  invoice.items = itemRows;

  console.log("Invoice Data passed from edit page: ",invoice);

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-6">
        Edit Invoice
      </h1>

      <div className="bg-white p-6 rounded-lg border border-slate-200">
        <InvoiceForm mode="edit" invoice={invoice}/>
      </div>
    </div>
  );
}