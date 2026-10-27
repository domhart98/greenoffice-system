"use client";

import { ArrowDown, ArrowUp, ArrowUpDown, MoveDown, MoveUp } from "lucide-react";

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
            <span className="uppercase">{label}</span>

            <span>
                {direction === "asc"
                    ? <MoveUp  size={16} strokeWidth={2}/>
                    : direction === "desc"
                    ? <MoveDown  size={16} strokeWidth={2}/>
                    : <ArrowUpDown size={16} strokeWidth={1}/>}
            </span>
        </button>
    );
}