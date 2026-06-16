export type InvoiceItem = {
  quantity: number;
  description: string;
  rate: number;
};

export type InvoiceData = {
  invoiceNumber: number;
  customerName: string;
  customerAddress: string;
  invoiceDate: string;
  terms: string;
  items: InvoiceItem[];
  subtotal: number;
  vat: number;
  total: number;
};