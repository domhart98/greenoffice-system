// lib/auth.ts

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";

export function getUserFromRequest() {

  const token = null; //cookies.get("auth_token")?.value;

  if (!token) {
    return null;
  }

  try {
    return jwt.verify(
      token,
      process.env.JWT_SECRET!
    );
  } catch {
    return null;
  }
}

export async function requireAuth() {
  const user = getUserFromRequest();

  if (!user) {
    redirect("/login");
  }

  return user;
}