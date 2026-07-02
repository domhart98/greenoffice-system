"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UserForm({
  mode,
  user,
}: {
  mode: "create" | "edit";
  user?: any;
}) {
  const router = useRouter();

  const [username, setUsername] = useState(
    user?.username || ""
  );

  const [password, setPassword] = useState("");

  const [role, setRole] = useState(
    user?.role || "VIEWER"
  );

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    const url =
      mode === "create"
        ? "/api/users"
        : `/api/users/${user.id}`;

    const method =
      mode === "create"
        ? "POST"
        : "PUT";

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
        role,
      }),
    });

    const result = await response.json();

    if (result.success) {
      router.push("/users");
      router.refresh();
    } else {
      alert(result.error);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <div>
        <label>Username</label>

        <input
          className="w-full border p-2 rounded"
          value={username}
          onChange={(e) =>
            setUsername(e.target.value)
          }
        />
      </div>

      <div>
        <label>
          Password
          {mode === "edit" &&
            " (leave blank to keep existing password)"}
        </label>

        <input
          type="password"
          className="w-full border p-2 rounded"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
        />
      </div>

      <div>
        <label>Role</label>

        <select
          className="w-full border p-2 rounded"
          value={role}
          onChange={(e) =>
            setRole(e.target.value)
          }
        >
          <option value="ADMIN">ADMIN</option>
          <option value="STAFF">STAFF</option>
          <option value="VIEWER">VIEWER</option>
        </select>
      </div>

      <button
        className="
          bg-green-600
          text-white
          px-4
          py-2
          rounded
        "
      >
        Save User
      </button>
    </form>
  );
}