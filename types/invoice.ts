export type InvoiceItem = {
  id?: number,
  invoice_id: number,
  product_id: number,
  quantity: number;
  product_name: string;
  product_price: number;
  subtotal: number;
  vat_rate: number;
  vat_total: number;
  total: number;
};

export type InvoiceData = {
  id?: number;
  invoice_number: number;
  customer_name: string;
  customer_address: string;
  invoice_date: string;
  terms: string;
  items: InvoiceItem[];
  subtotal: number;
  vat: number;
  total: number;
  customer_id: number;
  customer_phone: string;
  customer_email: string;
};