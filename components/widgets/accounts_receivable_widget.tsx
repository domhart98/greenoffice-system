"use client";

export default function AccountsReceivableWidget() {
  const receivables = [
    {
      label: "Current",
      amount: 743,
      color: "#059669",
    },
    {
      label: "1 - 30",
      amount: 28510,
      color: "#047857",
    },
    {
      label: "31 - 60",
      amount: 20473,
      color: "#7c3aed",
    },
    {
      label: "61 - 90",
      amount: 2386,
      color: "#06b6d4",
    },
    {
      label: "91 and over",
      amount: 6437,
      color: "#0f766e",
    },
  ];

  const total = 58548;

  const formatCurrency = (value: number) =>
    `Bds$${value.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

      {/* Header */}
      <div className="flex items-start justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-900">
          Accounts Receivable
        </h2>

        <span className="text-xs font-medium text-slate-600">
          As of today
        </span>
      </div>

      {/* Total */}
      <div className="mt-2">
        <p className="text-xs text-slate-600">
          Total
        </p>

        <p className="mt-1 text-2xl font-medium text-slate-800">
          {formatCurrency(total)}
        </p>
      </div>

      {/* Chart + Breakdown */}
      <div className="mt-4 flex items-center gap-4">

        {/* Donut */}
        <div className="relative h-28 w-28 shrink-0">

          <div
            className="h-full w-full rounded-full"
            style={{
              background: `
                conic-gradient(
                  #059669 0deg 4.6deg,
                  #047857 4.6deg 180deg,
                  #7c3aed 180deg 306deg,
                  #06b6d4 306deg 320deg,
                  #0f766e 320deg 360deg
                )
              `,
            }}
          />

          <div className="absolute inset-[27%] rounded-full bg-white" />
        </div>

        {/* Breakdown */}
        <div className="min-w-0 flex-1 space-y-2">

          {receivables.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 text-xs"
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{
                  backgroundColor: item.color,
                }}
              />

              <span className="min-w-0 flex-1 truncate text-slate-700">
                {item.label}
              </span>

              <span className="whitespace-nowrap text-slate-700">
                {formatCurrency(item.amount)}
              </span>
            </div>
          ))}

        </div>
      </div>

      {/* More options */}
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          className="text-lg leading-none text-slate-500 hover:text-slate-700"
          title="More options"
        >
          ⋮
        </button>
      </div>
    </div>
  );
}