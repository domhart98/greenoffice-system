"use client";

import { useEffect, useRef, useState } from "react";

interface SearchFilterOption {
  value: string;
  label: string;
}

interface DataTableSearchFilterProps {
  value: string;
  onChange: (value: string) => void;
  options: SearchFilterOption[];
  placeholder?: string;
  searchPlaceholder?: string;
}

export default function DataTableSearchFilter({
  value,
  onChange,
  options,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
}: DataTableSearchFilterProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter((option) =>
    option.label
      .toLowerCase()
      .includes(search.toLowerCase())
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
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedOption = options.find(
    (option) => option.value === value
  );

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setOpen(false);
    setSearch("");
  };

  const handleClear = () => {
    onChange("");
    setSearch("");
    setOpen(false);
  };

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
        <span className={selectedOption ? "text-slate-900" : "text-slate-500"}>
          {selectedOption?.label ?? placeholder}
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
        <div className="absolute right-0 z-50 mt-2 w-72 rounded-lg border border-slate-200 bg-white shadow-lg">

          {/* Search */}
          <div className="border-b border-slate-200 p-2">
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
            />
          </div>

          {/* Options */}
          <div className="max-h-64 overflow-y-auto p-1">

            <button
              type="button"
              onClick={handleClear}
              className="w-full rounded-md px-3 py-2 text-left text-sm text-slate-500 hover:bg-slate-50"
            >
              All customers
            </button>

            {filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`w-full rounded-md px-3 py-2 text-left text-sm transition hover:bg-emerald-50 ${
                  option.value === value
                    ? "bg-emerald-50 font-medium text-emerald-700"
                    : "text-slate-700"
                }`}
              >
                {option.label}
              </button>
            ))}

            {filteredOptions.length === 0 && (
              <div className="px-3 py-6 text-center text-sm text-slate-400">
                No customers found.
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}