import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSessionUserFromCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSessionUserFromCookie();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const [rows] = await pool.query(
    `SELECT id, email, name, age, blood_group, height_cm, weight_kg, allergies, location, phone, health_score, created_at
     FROM users WHERE id = ? LIMIT 1`,
    [session.id]
  );
  const user = (rows as any[])[0];
  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user });
}
