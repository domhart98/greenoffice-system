"use client";

import { useEffect, useRef, useState } from "react";
import { DataTableAction } from "./types";

interface ActionMenuProps<T> {
  row: T;
  actions: DataTableAction<T>[];
}

export default function ActionMenu<T>({
  row,
  actions,
}: ActionMenuProps<T>) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
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

  if (actions.length === 0) {
    return null;
  }

  return (
    <div
      ref={menuRef}
      className="relative inline-block text-left"
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
        aria-label="Actions"
        aria-expanded={open}
      >
        <span className="text-lg leading-none">⋮</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-44 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
          <div className="flex flex-col">
            {actions.map((action, index) => {
                const disabled = action.disabled?.(row) ?? false;

                return (
                <button
                    key={`${action.label}-${index}`}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                    setOpen(false);
                    action.onClick(row);
                    }}
                    className={`block w-full rounded-md px-3 py-2 text-left text-sm transition ${
                    action.variant === "danger"
                        ? "text-red-600 hover:bg-red-50"
                        : "text-slate-700 hover:bg-slate-50"
                    } disabled:cursor-not-allowed disabled:opacity-40`}
                >
                    {action.label}
                </button>
                );
            })}
          </div>   
        </div>
      )}
    </div>
  );
}