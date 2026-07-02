// lib/auth.ts

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import pool from "./db";

export async function getCurrentUser() {
  const token = (await cookies()).get("auth_token");

  if (!token) return null;

  const decoded = jwt.verify(
    token.value,
    process.env.JWT_SECRET!
  ) as any;

  const [rows]: any = await pool.query(
    `
    SELECT
      id,
      username,
      role
    FROM users
    WHERE id = ?
    `,
    [decoded.userId]
  );

  return rows[0];
}

export async function requireAuth() {
  const currentUser = await getCurrentUser();

  console.log(currentUser);

  if (!currentUser) {
    redirect("/login");
  }

  return currentUser;
}

export async function signup(formData: FormData) {
  
}