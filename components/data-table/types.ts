import { ReactNode } from "react";

export interface DataTableAction<T> {
  label: string;
  onClick: (row: T) => void;
  variant?: "default" | "danger";
  disabled?: (row: T) => boolean;
}

export interface Column<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  width?: string;
  className?: string;
  render?: (row: T) => ReactNode;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  rowKey: keyof T;
  loading?: boolean;
  emptyMessage?: string;
  onView?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  sortColumn?: string;
  sortDirection?: "asc"|"desc";
  onSort?: (column: string) => void;
  actions?: DataTableAction<T>[] | ((row: T) => DataTableAction<T>[]);
}