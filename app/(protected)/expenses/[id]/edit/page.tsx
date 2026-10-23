import pool from "@/lib/db";
import ExpenseForm from "@/components/forms/expense_form";

export default async function EditExpensePage({
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
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-6">
        Edit expense
      </h1>

      <div className="bg-white p-6 rounded-lg border border-slate-200">
        <ExpenseForm mode="edit" expense={expense}/>
      </div> 
    </div>
  );
}