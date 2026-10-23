import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import PayeeForm from "@/components/forms/payee_form";

export default async function PayeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  const [payeeRows] = await pool.query(
    `
    SELECT *
    FROM payees
    WHERE id = ?
    `,
    [id]
  );

  const payee = (payeeRows as any[])[0];

  if (!payee) {
    return (
      <div className="px-6 py-6">
        <p className="text-slate-500">
          Payee not found.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        View payee
      </h1>

      <PayeeForm mode="view" payee={payee}/>
    </div>
  );
}