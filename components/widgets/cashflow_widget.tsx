"use client";

import { useState } from "react";

type Period = "3_MONTHS" | "6_MONTHS" | "12_MONTHS";

const periodLabels: Record<Period, string> = {
  "3_MONTHS": "3 months",
  "6_MONTHS": "6 months",
  "12_MONTHS": "12 months",
};

export default function CashFlowWidget() {
  const [period, setPeriod] = useState<Period>("12_MONTHS");
  const [view, setView] = useState<"balance" | "money">("balance");

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-900">
            Cash Flow
          </h2>

          <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-500">
            <span>Last updated 6 hours ago</span>

            <button
              type="button"
              className="text-slate-500 hover:text-slate-700"
              title="Refresh"
            >
              ↻
            </button>
          </div>
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

      {/* Balance */}
      <div className="mt-2 flex items-end justify-between">
        <div>
          <p className="text-xs text-slate-600">
            Today's cash balance
          </p>

          <p className="mt-1 text-2xl font-medium text-slate-800">
            Bds$0
          </p>
        </div>

        {/* View toggle */}
        <div className="flex overflow-hidden rounded-md border border-slate-300 text-xs">
          <button
            type="button"
            onClick={() => setView("balance")}
            className={`px-3 py-1.5 ${
              view === "balance"
                ? "bg-slate-600 text-white"
                : "bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Cash balance
          </button>

          <button
            type="button"
            onClick={() => setView("money")}
            className={`px-3 py-1.5 ${
              view === "money"
                ? "bg-slate-600 text-white"
                : "bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Money in/out
          </button>
        </div>
      </div>

      {/* Chart skeleton */}
      <div className="mt-5">

        {/* Y-axis */}
        <div className="relative h-40 border-b border-slate-300">

          <div className="absolute inset-0 flex flex-col justify-between">
            {[40, 30, 20, 10, 0].map((value) => (
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

          {/* Placeholder chart area */}
          <div className="absolute bottom-0 left-10 right-0 h-full">

            <div className="absolute bottom-0 left-0 right-0 border-t-2 border-green-500" />

            <div className="absolute bottom-0 right-0 h-3/4 w-1/4 bg-green-100 opacity-80" />
          </div>
        </div>

        {/* X-axis */}
        <div className="ml-10 mt-2 flex justify-between text-[10px] text-slate-500">
          <span>Nov '25</span>
          <span>Dec '25</span>
          <span>Jan '26</span>
          <span>Feb '26</span>
          <span>Mar '26</span>
          <span>Apr '26</span>
          <span>May '26</span>
          <span>Jun '26</span>
          <span>Jul '26</span>
          <span>Aug '26</span>
          <span>Sep '26</span>
          <span>Oct '26</span>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex justify-center gap-4 text-[10px] text-slate-600">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          Cash balance
        </span>

        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-green-300" />
          Projected balance
        </span>

        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-slate-400" />
          Threshold
        </span>
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">

        <button
          type="button"
          className="text-xs font-medium text-blue-600 hover:text-blue-700"
        >
          View cash flow
        </button>

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