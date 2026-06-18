

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
    id: invoice.id,
    invoice_number: invoice.invoice_number,
    customer_name: invoice.customer_name,
    customer_address: invoice.customer_address,
    invoice_date: invoice.invoice_date,
    terms: invoice.terms,

    subtotal: invoice.subtotal,
    vat: invoice.vat,
    total: invoice.total,

    items: items.map(item => ({
      id: item.id,
      invoice_id: item.invoice_id,
      product_id: item.product_id,
      quantity: item.quantity,
      product_name: item.product_name,
      product_price: item.product_price,
      subtotal: item.subtotal,
      vat_total: item.subtotal,
      total:item.total,
    })),
  };

  console.log(JSON.stringify(invoiceData, null, 2));

  return (
    <div className="w-full mx-auto p-8">
      <InvoicePreview invoice={invoiceData}/>
    </div>
  );
}