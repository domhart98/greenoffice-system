import pool from "@/lib/db";
import InvoiceForm from "@/components/invoice_form";
import { InvoiceData } from "@/types/invoice";

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ invoiceNumber: string }>;
}) {
  const { invoiceNumber } = await params;

  const [invoiceRows]: any = await pool.query(
    `
    SELECT * 
    FROM invoices
    WHERE invoice_number = ?
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
    SELECT *
    FROM invoice_items
    WHERE invoice_id = ?
    `,
    [invoice.id]
  );

  invoice.items = itemRows;

  console.log("Invoice Data passed from edit page: ",invoice);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        Edit Invoice
      </h1>

      <InvoiceForm mode="edit" invoice={invoice}/>
    </div>
  );
}