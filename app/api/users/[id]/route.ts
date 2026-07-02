import {
  NextRequest,
  NextResponse,
} from "next/server";

import pool from "@/lib/db";
import bcrypt from "bcryptjs";
import { requireAuth } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  const currentUser =
    await requireAuth();

  if (currentUser.role !== "ADMIN") {
    return NextResponse.json(
      {
        success: false,
      },
      {
        status: 403,
      }
    );
  }

  const { id } = await params;

  const body = await req.json();

  if (body.password) {
    const hashedPassword =
      await bcrypt.hash(
        body.password,
        10
      );

    await pool.query(
      `
      UPDATE users
      SET
        username = ?,
        role = ?,
        password_hash = ?
      WHERE id = ?
      `,
      [
        body.username,
        body.role,
        hashedPassword,
        id,
      ]
    );
  } else {
    await pool.query(
      `
      UPDATE users
      SET
        username = ?,
        role = ?
      WHERE id = ?
      `,
      [
        body.username,
        body.role,
        id,
      ]
    );
  }

  return NextResponse.json({
    success: true,
  });
}

export async function DELETE(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  try {

    const currentUser =
      await requireAuth();

    // Only admins may delete users
    if (currentUser.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        {
          status: 403,
        }
      );
    }

    const { id } = await params;

    // Prevent admin deleting himself
    if (
      currentUser.id === Number(id)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You cannot delete your own account.",
        },
        {
          status: 400,
        }
      );
    }

    await pool.query(
      `
      DELETE FROM users
      WHERE id = ?
      `,
      [id]
    );

    return NextResponse.json({
      success: true,
    });

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete user",
      },
      {
        status: 500,
      }
    );
  }
}