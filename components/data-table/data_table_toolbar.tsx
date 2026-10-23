"use client";

interface DataTableToolbarProps {
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  onClearFilters?: () => void;
  actions?: React.ReactNode;
}

export default function DataTableToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters,
  onClearFilters,
  actions,
}: DataTableToolbarProps) {
  return (
    <div className="flex shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 py-4">

      {/* Search */}
      {onSearchChange && (
        <div className="w-72 shrink-0">
          <input
            type="text"
            value={search ?? ""}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
          />
        </div>
      )}

      {/* Filters + Clear Filters */}
      <div className="flex shrink-0 items-center gap-2">
        {filters}

        {onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="whitespace-nowrap rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Actions */}
      {actions && (
        <div className="ml-auto shrink-0">
          {actions}
        </div>
      )}

    </div>
  );
}