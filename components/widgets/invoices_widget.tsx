"use client";

export default function InvoicesWidget() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

      {/* Header */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-900">
          Invoices
        </h2>

        <div className="mt-2 flex items-center gap-2 text-xs text-red-800">
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-800 text-[10px] font-bold text-white">
            !
          </span>

          <span>
            Bds$5,190.91 needs attention
          </span>
        </div>
      </div>

      {/* Unpaid invoices */}
      <div className="mt-3">

        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-4">
            <span className="text-sm font-medium text-slate-800">
              Bds$102K Unpaid
            </span>

            <span className="text-xs text-slate-600">
              Last 365 days
            </span>
          </div>
        </div>

        <div className="mt-1 flex justify-between">
          <div>
            <p className="text-lg text-slate-800">
              Bds$52,533
            </p>

            <p className="text-xs text-slate-600">
              Overdue
            </p>
          </div>

          <div className="text-right">
            <p className="text-lg text-slate-800">
              Bds$49,724
            </p>

            <p className="text-xs text-slate-600">
              Not due yet
            </p>
          </div>
        </div>

        {/* Unpaid progress */}
        <div className="mt-2 flex h-5 overflow-hidden rounded-sm">
          <div
            className="bg-orange-500"
            style={{ width: "50%" }}
          />

          <div
            className="bg-slate-300"
            style={{ width: "50%" }}
          />
        </div>

      </div>

      {/* Paid invoices */}
      <div className="mt-3">

        <div className="flex items-baseline gap-4">
          <span className="text-sm font-medium text-slate-800">
            Bds$56,788 Paid
          </span>

          <span className="text-xs text-slate-600">
            Last 30 days
          </span>
        </div>

        <div className="mt-1 flex justify-between">
          <div>
            <p className="text-lg text-slate-800">
              Bds$0
            </p>

            <p className="text-xs text-slate-600">
              Not deposited
            </p>
          </div>

          <div className="text-right">
            <p className="text-lg text-slate-800">
              Bds$56,788
            </p>

            <p className="text-xs text-slate-600">
              Deposited
            </p>
          </div>
        </div>

        {/* Paid progress */}
        <div className="mt-2 h-5 overflow-hidden rounded-sm bg-green-600" />

      </div>

    </div>
  );
}