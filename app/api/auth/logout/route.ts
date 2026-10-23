import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function POST() {
  const currentUser = await getCurrentUser();

  await logAudit({
    userId: currentUser.id,
    action: "LOGOUT",
    entityName: "users",
    recordId: currentUser.id,
    description: `${currentUser.name} logged out`,
  });

  (await cookies()).delete("auth_token");

  return NextResponse.json({
    success: true,
  });
}