import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import ExpenseForm from "@/components/forms/expense_form";

export default async function ExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [rows]: any = await pool.query(
    `
    SELECT *
    FROM expenses
    WHERE id = ?
    `,
    [id]
  );

  const expense = rows[0];

  const [itemRows] = await pool.query(
    `
    SELECT *
    FROM expense_items
    WHERE expense_id = ?
    `,
    [expense.id]
  );

  expense.items = itemRows;

  console.log("Expense Data passed from edit page: ",expense);

  if (!expense) {
    return <div>expense not found</div>;
  }

  return (
    <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">
            View Expense
          </h1>
    
          <div className="bg-white p-6 rounded-lg border border-slate-200">
            <ExpenseForm mode="view" expense={expense}/>
          </div>
        </div>
  );
}