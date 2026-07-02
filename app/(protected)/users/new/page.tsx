import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import pool from "@/lib/db";

export default async function UsersPage() {
    const currentUser = await requireAuth();

    if (currentUser.role !== "ADMIN") {
        redirect("/");
    }

    const [users]: any = await pool.query(`
        SELECT
            id,
            username,
            role,
            created_at
        FROM users
        ORDER BY created_at DESC
    `);

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">
                Users
            </h1>

            <table className="w-full border">
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Role</th>
                        <th>Created</th>
                        <th>Actions</th>
                    </tr>
                </thead>

                <tbody>
                    {users.map((user: any) => (
                        <tr
                            key={user.id}
                            className="text-center"
                        >
                            <td>{user.username}</td>
                            <td>{user.role}</td>
                            <td>
                                {new Date(
                                    user.created_at
                                ).toLocaleDateString()}
                            </td>

                            <td>
                                <a
                                    className="text-blue-600 mr-4"
                                    href={`/users/${user.id}/edit`}
                                >
                                    Edit
                                </a>

                                <button
                                    className="text-red-600"
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <a
                href="/users/new"
                className="
                    mt-6
                    inline-block
                    bg-green-600
                    text-white
                    px-4
                    py-2
                    rounded
                "
            >
                New User
            </a>
        </div>
    );
}