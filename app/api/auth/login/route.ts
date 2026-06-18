import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(
  req: NextRequest
) {
  try {
    const body = await req.json();

    const [rows]: any = await pool.query(
      `
      SELECT *
      FROM users
      WHERE username = ?
      `,
      [body.username]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid username or password",
        },
        {
          status: 401,
        }
      );
    }

    const user = rows[0];

    const validPassword =
      await bcrypt.compare(
        body.password,
        user.password_hash
      );

    if (!validPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid username or password",
        },
        {
          status: 401,
        }
      );
    }

    const token = jwt.sign(
        {
            userId: user.id,
            username: user.username,
            role: user.role,
        },
        process.env.JWT_SECRET!,
        {
            expiresIn: "7d",
        }
    );

    const response = NextResponse.json({
        success: true,
    });

    response.cookies.set(
    "auth_token",
    token,
    {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
    }
  );

  return response;
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Login failed",
      },
      {
        status: 500,
      }
    );
  }
}