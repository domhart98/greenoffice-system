"use client";

import { useState } from "react";

type Period = "LAST_30_DAYS" | "LAST_90_DAYS" | "THIS_YEAR";

const periodLabels: Record<Period, string> = {
  LAST_30_DAYS: "Last 30 days",
  LAST_90_DAYS: "Last 90 days",
  THIS_YEAR: "This year",
};

const expenses = [
  {
    name: "Wages",
    amount: 13088.63,
    change: "5%",
    direction: "down",
    color: "bg-blue-600",
  },
  {
    name: "Legal and ...",
    amount: 12000,
    change: "",
    direction: "neutral",
    color: "bg-teal-500",
  },
  {
    name: "Supplies",
    amount: 2858.58,
    change: "77%",
    direction: "up",
    color: "bg-purple-700",
  },
  {
    name: "Payroll ...",
    amount: 955,
    change: "120%",
    direction: "up",
    color: "bg-orange-600",
  },
];

export default function ExpensesWidget() {
  const [period, setPeriod] = useState<Period>("LAST_30_DAYS");

  const totalExpenses = 32466;

  const formatCurrency = (value: number) =>
    `Bds$${value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

      {/* Header */}
      <div className="flex items-start justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-900">
          Expenses
        </h2>

        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as Period)}
          className="cursor-pointer border-none bg-transparent text-xs font-medium text-slate-700 outline-none"
        >
          {Object.entries(periodLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Summary */}
      <div className="mt-2">
        <p className="text-xs text-slate-600">
          Spending for {periodLabels[period].toLowerCase()}
        </p>

        <div className="mt-1 flex items-center gap-2">
          <span className="text-xl font-medium text-slate-800">
            {formatCurrency(totalExpenses)}
          </span>

          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-600">
            i
          </span>

          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
            100%
          </span>
        </div>

        <div className="mt-1 flex items-center gap-1 text-xs font-medium text-green-600">
          <span className="text-base">↓</span>
          Down 20%
          <span className="font-normal text-slate-600">
            from prior 30 days
          </span>
        </div>
      </div>

      {/* Chart + breakdown */}
      <div className="mt-4 flex items-center gap-4">

        {/* Donut chart */}
        <div className="relative h-28 w-28 shrink-0">

          <div
            className="h-full w-full rounded-full"
            style={{
              background:
                "conic-gradient(#2563eb 0deg 145deg, #14b8a6 145deg 280deg, #5b21b6 280deg 320deg, #ea580c 320deg 345deg, #991b1b 345deg 360deg)",
            }}
          />

          <div className="absolute inset-[25%] rounded-full bg-white" />
        </div>

        {/* Expense breakdown */}
        <div className="min-w-0 flex-1 space-y-2">

          {expenses.map((expense) => (
            <div
              key={expense.name}
              className="flex items-center gap-2 text-xs"
            >
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${expense.color}`}
              />

              <span className="min-w-0 flex-1 truncate text-slate-700">
                {expense.name}
              </span>

              <span className="whitespace-nowrap text-slate-700">
                {formatCurrency(expense.amount)}
              </span>

              {expense.direction === "down" && (
                <span className="whitespace-nowrap font-medium text-green-600">
                  ↓ {expense.change}
                </span>
              )}

              {expense.direction === "up" && (
                <span className="whitespace-nowrap font-medium text-orange-600">
                  ↑ {expense.change}
                </span>
              )}

              {expense.direction === "neutral" && (
                <span className="text-slate-500">
                  →
                </span>
              )}
            </div>
          ))}

        </div>
      </div>

      {/* More options */}
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          className="text-lg leading-none text-slate-500 hover:text-slate-700"
          title="More options"
        >
          ⋮
        </button>
      </div>
    </div>
  );
}