import pool from "@/lib/db";
import UserForm from "@/components/forms/user_form";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [rows]: any = await pool.query(
    `
    SELECT *
    FROM users
    WHERE id = ?
    `,
    [id]
  );

  const user = rows[0];

  if (!user) {
    return <div>User not found</div>;
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">
        Edit User
      </h1>

      <UserForm mode="edit" user={user}/>
    </div>
  );
}