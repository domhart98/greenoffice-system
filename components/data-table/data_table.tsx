"use client";

import { DataTableProps, DataTableAction } from "./types";
import SortableHeader from "./sortable_header";
import LoadingSpinner from "../loading_spinner";
import { useMemo, useState } from "react";
import { tableStyles } from "./styles";
import ActionMenu from "./action_menu";

export default function DataTable<T>({
  data,
  columns,
  rowKey,
  loading = false,
  emptyMessage = "No data found.",
  onEdit,
  onView,
  onDelete,
  sortColumn,
  sortDirection,
  onSort,
  actions,
}: DataTableProps<T>) {

  const hasActions = actions || onView || onEdit || onDelete;
  const [search, setSearch] = useState("");

  if (loading) {
    return <LoadingSpinner/>;
  }

  if (data.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-10 text-center text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={tableStyles.container}>
      <div className="h-full overflow-x-auto">
        <table className={tableStyles.table}>
          <thead className={tableStyles.header}>
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={tableStyles.headerCell}
                >
                  <SortableHeader label={column.header} sortable={column.sortable} 
                                  direction={
                                    sortColumn === column.key ? sortDirection : undefined
                                  }
                                  onClick={() => onSort?.(String(column.key))}
                  />
                </th>
              ))}
              {hasActions && (
                <th className={tableStyles.headerCell}>
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((row, index) => (

              <tr
                key={String(row[rowKey])}
                className={tableStyles.row}
              >
                {columns.map((column) => (
                  <td
                    key={String(column.key)}
                    className={tableStyles.cell}
                  >
                    {column.render
                      ? column.render(row)
                      : String((row as Record<string, unknown>)[String(column.key)] ?? "")
                    }
                  </td>
                ))}
                {hasActions && (
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex justify-center">
                      <ActionMenu
                        actions={
                          actions
                            ? typeof actions === "function"
                              ? actions(row)
                              : actions
                            : [
                                ...(onView
                                  ? [
                                      {
                                        label: "View",
                                        onClick: onView,
                                      },
                                    ]
                                  : []),

                                ...(onEdit
                                  ? [
                                      {
                                        label: "Edit",
                                        onClick: onEdit,
                                      },
                                    ]
                                  : []),

                                ...(onDelete
                                  ? [
                                      {
                                        label: "Delete",
                                        onClick: onDelete,
                                        variant: "danger" as const,
                                      },
                                    ]
                                  : []),
                              ]
                        }
                        row={row}
                      />
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}