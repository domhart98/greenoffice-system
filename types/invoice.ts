export type InvoiceItem = {
  id?: number,
  invoice_id: number,
  line_number: number;
  product_id: number,
  quantity: number;
  product_name: string;
  description: string;
  product_price: number;
  subtotal: number;
  vat_rate: number;
  vat_total: number;
  total: number;
};

export type Payment = {
  id?: number;
  payment_number: number;
  payment_date: string;
  payment_method: string;
  reference: string;
  memo: string;
  amount: number;
}

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
  customer_city: string;
  customer_state: string;
  customer_country: string;
  customer_postcode: string;
  customer_balance: string;
  customer_companyname: string;
  status: string;
  due_date: string;
  open_balance: number;
  payments: Payment[];
};

