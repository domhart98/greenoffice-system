export default function InvoiceStatusBadge({
  status,
}: {
  status: string;
}) {
  const styles = {
    DRAFT: "bg-gray-200 text-gray-800",
    SENT: "bg-blue-200 text-blue-800",
    PAID: "bg-green-200 text-green-800",
    VOID: "bg-red-200 text-red-800",
  };

  return (
    <span
      className={`px-2 py-1 rounded text-sm font-medium ${
        styles[status as keyof typeof styles]
      }`}
    >
      {status}
    </span>
  );
}