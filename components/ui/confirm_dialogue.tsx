"use client";

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    loading?: boolean;
}

export default function ConfirmDialogue({open, title, message, confirmText, cancelText, onConfirm, onCancel, loading}: ConfirmDialogProps) {
    
    if (!open) return null;
    
    return(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
                <div className="border-b border-slate-200 px-6 py-4">
                    <h2 className="text-lg font-semibold text-slate-900">
                        {title}
                    </h2>
                    <div className="px-6 py-5">
                        <p className="text-sm text-slate-600">
                            {message}
                        </p>
                    </div>
                    <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
                        <button
                            onClick={onCancel}
                            className="rounded-md border border-slate-300 px-4 py-2 hover:bg-slate-100"
                        >
                            {cancelText ?? "Cancel"}
                        </button>
                        <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
                    >
                        {loading ? "Confirming..." : confirmText ?? "Confirm"}
                    </button>
                    </div>
                </div>
            </div>
        </div>
    )
}