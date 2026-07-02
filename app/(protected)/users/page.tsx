"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function UsersPage() {

    const [users, setUsers] = useState([]);
    const [role, setRole] = useState("");

    useEffect(() => {
      const fetchUsers = async () => {
         const response = await fetch(
            `/api/users`
         );
      

        const data = await response.json();

        setUsers(data);
        };

        fetchUsers();
    },[]);

    if (!users) {
      return <div className="p-6">Loading Users...</div>;
    }

    return (
        <div className="p-6">
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
                        <tr className="text-center" key={user.id}>
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

                                <button className="text-red-600"
                                    onClick={async () => {

                                        const confirmed = confirm(
                                            `Delete ${user.username}?`
                                        );

                                        if (!confirmed) return;

                                        const response = await fetch(
                                            `/api/users/${user.id}`,
                                            {
                                                method: "DELETE",
                                            }
                                        );

                                        const result =
                                            await response.json();

                                        if (result.success) {
                                            window.location.reload();
                                        } else {
                                            alert(result.error);
                                        }
                                    }}
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