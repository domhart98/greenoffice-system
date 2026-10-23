"use client";

interface SortableHeaderProps {
    label: string;
    sortable?: boolean;
    direction?: "asc" | "desc";
    onClick?: () => void;
}

export default function SortableHeader({
    label,
    sortable = false,
    direction,
    onClick,
}: SortableHeaderProps) {
    if (!sortable) {
        return <>{label}</>;
    }

    return (
        <button
            onClick={onClick}
            className="flex items-center gap-1 hover:text-blue-600"
        >
            <span>{label}</span>

            <span>
                {direction === "asc"
                    ? "▲"
                    : direction === "desc"
                    ? "▼"
                    : "↕"}
            </span>
        </button>
    );
}