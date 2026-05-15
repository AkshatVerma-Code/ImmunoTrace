import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { pool } from "@/lib/db";
import { signSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    email,
    password,
    name,
    age,
    height_cm,
    weight_kg,
    blood_group,
    allergies,
    location,
  } = body;

  if (!email || !password || !name) {
    return NextResponse.json(
      { message: "Name, email and password are required." },
      { status: 400 }
    );
  }

  const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
  if ((existing as any[]).length > 0) {
    return NextResponse.json({ message: "Email already registered." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
    `INSERT INTO users
    (email, password_hash, name, age, height_cm, weight_kg, blood_group, allergies, location)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      email,
      passwordHash,
      name,
      age || null,
      height_cm || null,
      weight_kg || null,
      blood_group || null,
      allergies || null,
      location || null,
    ]
  );

  const userId = (result as any).insertId as number;
  const token = signSession({ id: userId, email });

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
