export type ExpenseLineType = "PRODUCT" | "EXPENSE";

export interface ExpenseItem {
  id?: number;

  product_id: number | null;
  category_id: number | null;

  line_number: number;

  description: string;

  quantity: number;
  unit_price: number;

  vat_rate: number;
  subtotal: number;
  vat_total: number;
  total: number;
}

export interface ExpenseData {
  id: number;

  expense_number: string;

  payee_id: number | null;
  payee_name?: string | null;
  payee_type?: string | null;

  expense_date: string;
  payment_method: string | null;

  status: string;

  subtotal: number;
  vat_total: number;
  total: number;
  open_balance: number;

  memo: string | null;

  created_at?: string;
  updated_at?: string;

  items?: ExpenseItem[];
}