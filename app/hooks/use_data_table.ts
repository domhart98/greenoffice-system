import { useMemo, useState } from "react";

type DataTableFilter<T> = {
  key: keyof T;
  value: string;
};

type DataTableDateFilter<T> = {
  key: keyof T;
  value: string;
  customStartDate?: string;
  customEndDate?: string;
};

export function useDataTable<T>(
    data: T[],
    pageSize: number,
    searchFields?: (keyof T)[],
    filters?: DataTableFilter<T>[],
    dateFilter?: DataTableDateFilter<T>,
) {
    
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [sortColumn, setSortColumn] = useState<keyof T>();
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

    const getDateRange = (
        range: string,
        customStartDate?: string,
        customEndDate?: string
        ) => {
        const now = new Date();

        if (range === "custom") {
            if (!customStartDate || !customEndDate) {
            return null;
            }

            const start = new Date(`${customStartDate}T00:00:00`);
            const end = new Date(`${customEndDate}T23:59:59.999`);

            return {
            start,
            end,
            };
        }

        const start = new Date(now);
        const end = new Date(now);

        switch (range) {
            case "last_month":
            start.setMonth(now.getMonth() - 1);
            start.setDate(1);

            end.setDate(0);
            break;

            case "last_3_months":
            start.setMonth(now.getMonth() - 3);
            start.setDate(1);
            break;

            case "last_6_months":
            start.setMonth(now.getMonth() - 6);
            start.setDate(1);
            break;

            case "year_to_date":
            start.setMonth(0);
            start.setDate(1);
            break;

            case "this_year":
            start.setMonth(0);
            start.setDate(1);

            end.setMonth(11);
            end.setDate(31);
            break;

            default:
            return null;
        }

        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        return { start, end };
    };

    const filteredData = useMemo(() => {
console.log("DATE FILTER:", dateFilter);

if (data.length > 0) {
  console.log(
    "FIRST DATE:",
    data[0][dateFilter?.key as keyof T]
  );
}
        return data.filter((row) => {

            // -------------------------
            // Search
            // -------------------------

            if (search.trim()) {

                const fieldsToSearch =
                    searchFields && searchFields.length > 0
                        ? searchFields
                        : Object.keys(row as Record<string, unknown>) as (keyof T)[];

                const searchMatch = fieldsToSearch.some((field) => {

                    const value = row[field];

                    return String(value ?? "")
                        .toLowerCase()
                        .includes(search.toLowerCase());

                });

                if (!searchMatch) {
                    return false;
                }
            }


            // -------------------------
            // Filters
            // -------------------------

            // Normal filters
            if (filters && filters.length > 0) {

                const filtersMatch = filters.every((filter) => {

                    if (!filter.value) {
                        return true;
                    }

                    const value = row[filter.key];

                    return String(value ?? "") === String(filter.value);

                });

                if (!filtersMatch) {
                    return false;
                }
            }

            // Date filter
            if (dateFilter?.value) {
                const range = getDateRange(
                                dateFilter.value,
                                dateFilter.customStartDate,
                                dateFilter.customEndDate
                            );

                if (range) {
                    const rawValue = row[dateFilter.key];

                    if (!rawValue) {
                    return false;
                    }

                    const rowDate = new Date(String(rawValue));

                    if (
                        Number.isNaN(rowDate.getTime()) ||
                        rowDate < range.start ||
                        rowDate > range.end
                    ) {
                        return false;
                    }
                }
            }


            return true;

        });

    }, [data, search, searchFields, filters, dateFilter]);

    const sortedData = useMemo(() => {

        if (!sortColumn)
            return filteredData;

        return [...filteredData].sort((a, b) => {

            const aValue = a[sortColumn];
            const bValue = b[sortColumn];

            if (aValue < bValue)
                return sortDirection === "asc" ? -1 : 1;

            if (aValue > bValue)
                return sortDirection === "asc" ? 1 : -1;

            return 0;

        });

    }, [filteredData, sortColumn, sortDirection]);

    const totalPages = Math.ceil(
        sortedData.length / pageSize
    );

    const paginatedData = sortedData.slice(

        (currentPage - 1) * pageSize,

        currentPage * pageSize

    );

    const handleSort = (column: keyof T) => {

        if (sortColumn === column) {

            setSortDirection(prev =>
                prev === "asc"
                    ? "desc"
                    : "asc"
            );

        } else {

            setSortColumn(column);

            setSortDirection("asc");

        }

    };

    return {

        search,

        setSearch,

        currentPage,

        setCurrentPage,

        sortColumn,

        sortDirection,

        handleSort,

        totalPages,

        paginatedData

    };
}