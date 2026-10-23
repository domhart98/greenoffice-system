
"use client";

import { Construction } from "lucide-react";

type UnderConstructionProps = {
    title?: string;
    description?: string;
};

export default function UnderConstruction({
    title = "Under Construction",
    description = "We're working on this section of Green Office. Check back soon for updates.",
}: UnderConstructionProps) {
    return (
        <div className="flex min-h-[60vh] items-center justify-center p-6">
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                    <Construction
                        size={32}
                        className="text-slate-600"
                        strokeWidth={1.75}
                    />
                </div>

                <h1 className="mb-3 text-2xl font-bold text-slate-800">
                    {title}
                </h1>

                <p className="text-sm leading-6 text-slate-500">
                    {description}
                </p>

                <div className="mx-auto mt-6 h-1 w-16 rounded-full bg-blue-600" />
                
                <p className="mt-4 text-xs font-medium uppercase tracking-wider text-slate-400">
                    Green Office · Coming Soon
                </p>
            </div>
        </div>
    );
}
