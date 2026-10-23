"use client";

import { useEffect, useRef, useState } from "react";

interface DataTableDateFilterProps {
  value: string;
  onChange: (value: string) => void;

  customStartDate?: string;
  customEndDate?: string;

  onCustomDateChange?: (
    startDate: string,
    endDate: string
  ) => void;

  placeholder?: string;
}

const dateRangeOptions = [
  {
    value: "last_month",
    label: "Last month",
  },
  {
    value: "last_3_months",
    label: "Last 3 months",
  },
  {
    value: "last_6_months",
    label: "Last 6 months",
  },
  {
    value: "year_to_date",
    label: "Year to date",
  },
  {
    value: "this_year",
    label: "This year",
  },
  {
    value: "custom",
    label: "Custom date",
  },
];

export default function DataTableDateFilter({
  value,
  onChange,
  customStartDate = "",
  customEndDate = "",
  onCustomDateChange,
  placeholder = "Date",
}: DataTableDateFilterProps) {
  const [open, setOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = dateRangeOptions.find(
    (option) => option.value === value
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  const handleOptionSelect = (optionValue: string) => {
    onChange(optionValue);

    if (optionValue !== "custom") {
      setOpen(false);
    }
  };

  const formatDate = (date: string) => {
    if (!date) return "";

    const [year, month, day] = date.split("-");

    return `${month}/${day}/${year}`;
  };

  const displayLabel =
    value === "custom" && customStartDate && customEndDate
        ? `${formatDate(customStartDate)} - ${formatDate(customEndDate)}`
        : selectedOption?.label ?? placeholder;

  return (
    <div
      ref={containerRef}
      className="relative"
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex min-w-48 items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm transition focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 ${
                    value
                        ? "border-emerald-300 bg-emerald-50 font-medium text-emerald-700"
                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
      >
        <span
          className={
            selectedOption
              ? "text-slate-900"
              : "text-slate-500"
          }
        >
          {displayLabel}
        </span>

        <svg
          className="h-4 w-4 text-slate-400"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">

          {/* All dates */}
          <button
            type="button"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className="w-full rounded-md px-3 py-2 text-left text-sm text-slate-500 hover:bg-slate-50"
          >
            All dates
          </button>

          {/* Presets */}
          {dateRangeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                handleOptionSelect(option.value)
              }
              className={`w-full rounded-md px-3 py-2 text-left text-sm transition hover:bg-emerald-50 ${
                option.value === value
                  ? "bg-emerald-50 font-medium text-emerald-700"
                  : "text-slate-700"
              }`}
            >
              {option.label}
            </button>
          ))}

          {/* Custom dates */}
          {value === "custom" && (
            <div className="mt-1 border-t border-slate-200 p-3">

              <div className="space-y-3">

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    From
                  </label>

                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) =>
                      onCustomDateChange?.(
                        e.target.value,
                        customEndDate
                      )
                    }
                    className="w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    To
                  </label>

                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) =>
                      onCustomDateChange?.(
                        customStartDate,
                        e.target.value
                      )
                    }
                    className="w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                  />
                </div>

                <button
                  type="button"
                  disabled={
                    !customStartDate ||
                    !customEndDate ||
                    customStartDate > customEndDate
                  }
                  onClick={() => setOpen(false)}
                  className="w-full rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Apply
                  {customStartDate &&
                    customEndDate &&
                    customStartDate > customEndDate && (
                        <p className="text-xs text-red-500">
                        End date must be after start date.
                        </p>
                  )}
                </button>

              </div>

            </div>
          )}

        </div>
      )}
    </div>
  );
}