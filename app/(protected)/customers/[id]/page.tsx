import pool from "@/lib/db";

export default async function CustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [customerRows] = await pool.query(
    `
    SELECT *
    FROM customers
    WHERE id = ?
    `,
    [id]
  );

  const customer = (customerRows as any[])[0];

  if (!customer) {
    return (
      <div className="p-6">
        Customer not found
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-lg  border bg-white shadow-sm p-4">
        <h3 className="font-semibold text-lg mb-3">
        Customer Details
        </h3>

        <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
            <div className="text-gray-500">
            Name
            </div>

            <div>
            {customer.name}
            </div>
        </div>

        <div>
            <div className="text-gray-500">
            Phone
            </div>

            <div>
            {customer.phone}
            </div>
        </div>

        <div className="col-span-2">
            <div className="text-gray-500">
            Address
            </div>

            <div className="whitespace-pre-line">
            {customer.address}
            </div>
        </div>

        <div>
            <div className="text-gray-500">
            Email
            </div>

            <div>
            {customer.email}
            </div>
        </div>
        <div>
            <div className="text-gray-500">
            Notes
            </div>

            <div>
            {customer.notes}
            </div>
        </div>
        <div>
            <div className="text-gray-500">
            Created On
            </div>

            <div>
              {new Date(customer.created_at).toLocaleDateString()}
            </div>
        </div>
      </div>
    </div>
  );
}