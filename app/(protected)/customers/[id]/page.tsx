import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import CustomerForm from "@/components/forms/customer_form";

export default async function CustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

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
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        Edit Customer
      </h1>

      <CustomerForm mode="view" customer={customer}/>
    </div>
  );
}