import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function POST() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    (await cookies()).delete("auth_token");

    return NextResponse.json(
      { success: false, message: "Not authenticated" },
      { status: 401 }
    );
  }

  await logAudit({
    userId: currentUser.id,
    action: "LOGOUT",
    entityName: "users",
    recordId: currentUser.id,
    description: `${currentUser.username} logged out`,
  });

  return NextResponse.json({
    success: true,
  });
}