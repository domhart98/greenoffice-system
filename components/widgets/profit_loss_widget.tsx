"use client";

import { useState } from "react";
import DataTableDateFilter from "../data-table/data_table_date_filter";

interface ProfitLossWidgetProps {
  netProfit?: number;
  profitChange?: number;
  income?: number;
  expenses?: number;
  period?: string;
  onPeriodChange?: (period: string) => void;
}

interface ProfitLossWidgetProps {
  netProfit?: number;
  profitChange?: number;
  income?: number;
  expenses?: number;
}

export default function ProfitLossWidget({
  netProfit = 41492,
  profitChange = 100,
  income = 82653,
  expenses = 41160,
  onPeriodChange,
}: ProfitLossWidgetProps) {
  const [period, setPeriod] = useState("last_month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const formatCurrency = (value: number) => {
    return `Bds$${value.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const maxValue = Math.max(income, expenses);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">
          Profit & Loss
        </h2>

        <DataTableDateFilter
          value={period}
          onChange={setPeriod}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
          onCustomDateChange={(startDate, endDate) => {
            setCustomStartDate(startDate);
            setCustomEndDate(endDate);
          }}
        />
      </div>

      {/* Net Profit */}
      <div className="mb-5">
        <p className="text-xs text-slate-600">
          Net profit for selected period
        </p>

        <div className="mt-1 flex items-center gap-2">
          <span className="text-xl font-medium text-slate-800">
            {formatCurrency(netProfit)}
          </span>

          <span className="flex h-5 items-center rounded-full bg-blue-50 px-2 text-xs font-medium text-blue-600">
            i
          </span>

          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
            {profitChange}%
          </span>
        </div>

        <div className="mt-1 flex items-center gap-1 text-xs font-medium text-green-600">
          <span className="text-base">↑</span>
          Up 450% from
        </div>
      </div>

      {/* Income */}
      <div className="mb-5">
        <div className="mb-1">
          <p className="text-sm font-medium text-slate-800">
            {formatCurrency(income)}
          </p>

          <p className="text-xs text-slate-600">
            Income
          </p>
        </div>

        <div className="h-3 overflow-hidden rounded-sm bg-slate-100">
          <div
            className="h-full rounded-sm bg-green-500"
            style={{
              width: `${(income / maxValue) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Expenses */}
      <div>
        <div className="mb-1">
          <p className="text-sm font-medium text-slate-800">
            {formatCurrency(expenses)}
          </p>

          <p className="text-xs text-slate-600">
            Expenses
          </p>
        </div>

        <div className="h-3 overflow-hidden rounded-sm bg-slate-100">
          <div
            className="h-full rounded-sm bg-teal-600"
            style={{
              width: `${(expenses / maxValue) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}