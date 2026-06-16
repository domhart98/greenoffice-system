import pool from "@/lib/db";
import CustomerForm from "@/components/customer_form";

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [rows]: any = await pool.query(
    `
    SELECT *
    FROM customers
    WHERE id = ?
    `,
    [id]
  );

  const customer = rows[0];

  console.log(customer);

  if (!customer) {
    return <div>Customer not found</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        Edit Customer
      </h1>

      <CustomerForm customer={customer}/>
    </div>
  );
}