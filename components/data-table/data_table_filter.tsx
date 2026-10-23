
"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";

interface DataTableFilterProps {
  value: string;
  onChange: (value: string) => void;
  options: {
    value: string;
    label: string;
  }[];
  placeholder: string;
}

export default function DataTableFilter({
  value,
  onChange,
  options,
  placeholder,
}: DataTableFilterProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
  };

  return (
    <div ref={containerRef} className="relative shrink-0">
      {/* Dropdown trigger */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex min-w-48 items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm transition focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 ${
          value
            ? "border-emerald-300 bg-emerald-50 font-medium text-emerald-700"
            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
        }`}
      >
        <span className={selectedOption ? "text-slate-900" : "text-slate-500"}>
          {selectedOption?.label ?? placeholder}
        </span>

        <ChevronDown
          size={16}
          className={`shrink-0 text-slate-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown menu */}
      {open && (
        <div
          role="listbox"
          className="absolute left-0 z-50 mt-2 w-full min-w-48 overflow-hidden rounded-lg border border-slate-200 bg-white p-1 shadow-lg"
        >
          {/* Clear selection */}
          <button
            type="button"
            role="option"
            aria-selected={!value}
            onClick={() => handleSelect("")}
            className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition hover:bg-emerald-50 ${
              !value
                ? "bg-emerald-50 font-medium text-emerald-700"
                : "text-slate-500"
            }`}
          >
            <span>{placeholder}</span>
            {!value && <Check size={15} />}
          </button>

          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(option.value)}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition hover:bg-emerald-50 ${
                  isSelected
                    ? "bg-emerald-50 font-medium text-emerald-700"
                    : "text-slate-700"
                }`}
              >
                <span>{option.label}</span>
                {isSelected && <Check size={15} />}
              </button>
            );
          })}

          {options.length === 0 && (
            <div className="px-3 py-4 text-center text-sm text-slate-400">
              No options available.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
