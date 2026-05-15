import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { pool } from "@/lib/db";
import { signSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json(
      { message: "Email and password are required." },
      { status: 400 }
    );
  }

  const [rows] = await pool.query("SELECT * FROM users WHERE email = ? LIMIT 1", [email]);
  const user = (rows as any[])[0];
  if (!user) {
    return NextResponse.json({ message: "Invalid credentials." }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return NextResponse.json({ message: "Invalid credentials." }, { status: 401 });
  }

  const token = signSession({ id: user.id, email: user.email });

  const response = NextResponse.json({ ok: true });
  response.cookies.set("immunotrace_token", token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
