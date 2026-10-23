"use client";

import { useState } from "react";

type Period = "THIS_YEAR" | "LAST_YEAR" | "LAST_12_MONTHS";

const periodLabels: Record<Period, string> = {
  THIS_YEAR: "This year to date",
  LAST_YEAR: "Last year",
  LAST_12_MONTHS: "Last 12 months",
};

const monthlySales = [
  { month: "Jan", amount: 90000 },
  { month: "Feb", amount: 57000 },
  { month: "Mar", amount: 60000 },
  { month: "Apr", amount: 82000 },
  { month: "May", amount: 45000 },
  { month: "Jun", amount: 47000 },
  { month: "Jul", amount: 80000 },
  { month: "Aug", amount: 42000 },
];

export default function SalesWidget() {
  const [period, setPeriod] = useState<Period>("THIS_YEAR");

  const maxAmount = 100000;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-900">
            Sales
          </h2>

          <p className="mt-2 text-xs text-slate-600">
            Total Amount
          </p>

          <p className="mt-1 text-2xl font-medium text-slate-800">
            Bds$507,006
          </p>
        </div>

        {/* Period selector */}
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

      {/* Chart */}
      <div className="mt-5">

        <div className="relative h-32">

          {/* Horizontal grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between">
            {[100, 75, 50, 25, 0].map((value) => (
              <div
                key={value}
                className="flex items-center"
              >
                <span className="w-8 text-[10px] font-medium text-slate-500">
                  {value === 0 ? "0" : `${value}K`}
                </span>

                <div className="ml-2 flex-1 border-t border-slate-200" />
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="absolute bottom-0 left-10 right-0 top-0">
            <svg
              viewBox="0 0 800 200"
              preserveAspectRatio="none"
              className="h-full w-full"
            >
              <polyline
                points={monthlySales
                  .map((item, index) => {
                    const x =
                      (index / (monthlySales.length - 1)) * 800;

                    const y =
                      200 -
                      (item.amount / maxAmount) * 180;

                    return `${x},${y}`;
                  })
                  .join(" ")}
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="text-green-500"
              />

              {monthlySales.map((item, index) => {
                const x =
                  (index / (monthlySales.length - 1)) * 800;

                const y =
                  200 -
                  (item.amount / maxAmount) * 180;

                return (
                  <circle
                    key={item.month}
                    cx={x}
                    cy={y}
                    r="7"
                    className="fill-green-500"
                  />
                );
              })}
            </svg>
          </div>
        </div>

        {/* X-axis */}
        <div className="ml-10 mt-2 flex justify-between text-[10px] text-slate-600">
          {monthlySales.map((item) => (
            <span key={item.month}>
              {item.month}
            </span>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex justify-end">
        <div className="flex items-center gap-2 text-[10px] text-slate-600">
          <span className="h-1 w-2 bg-green-500" />
          Amount
        </div>
      </div>

      {/* More options */}
      <div className="mt-1 flex justify-end">
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