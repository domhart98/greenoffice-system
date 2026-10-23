"use client";

import ExpenseForm from "@/components/forms/expense_form";

export default function NewExpensePage() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-6">
        Create Expense
      </h1>

      <div className="bg-white p-6 rounded-lg border border-slate-200">
        <ExpenseForm mode="create"/>
      </div> 
    </main>
  );
}