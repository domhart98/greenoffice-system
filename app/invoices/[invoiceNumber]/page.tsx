

import pool from "@/lib/db";
import InvoicePreview from "@/components/invoice_preview";

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
      <div className="p-6">
        Invoice not found
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

  const items = itemRows as any[];

  const invoiceData = {
    invoiceNumber: invoice.invoice_number,
    customerName: invoice.customer_name,
    customerAddress: invoice.customer_address,
    invoiceDate: invoice.invoice_date,
    terms: invoice.terms,

    subtotal: Number(invoice.subtotal),
    vat: Number(invoice.vat),
    total: Number(invoice.total),

    items: items.map(item => ({
      productId: item.product_id,
      quantity: item.quantity,
      description: item.description,
      rate: Number(item.rate),
      amount: Number(item.amount),
    })),
  };

  console.log(JSON.stringify(invoiceData, null, 2));

  return (
    <div className="w-full mx-auto p-8">
      <InvoicePreview invoice={invoiceData}/>
    </div>
  );
}