import pool from "@/lib/db";
import PayeeForm from "@/components/forms/payee_form";

export default async function EditPayeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [rows]: any = await pool.query(
    `
    SELECT *
    FROM payees
    WHERE id = ?
    `,
    [id]
  );

  const payee = rows[0];

  if (!payee) {
    return <div>payee not found</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        Edit payee
      </h1>

      <PayeeForm mode="edit" payee={payee}/>
    </div>
  );
}