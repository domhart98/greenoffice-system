export type Product = {
  id?: number;
  sku: string | null;
  name: string;
  price: number;
  vat_rate: number;
  is_active: boolean;
  stock_quantity: number;
  type: string;
  category: string;
  cost: number;
  sales_description: string;
  purchase_description: string;
  reorder_point: number;
  income_account: string;
  expense_account: string;
  inventory_account: string;
};