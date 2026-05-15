import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSessionUserFromCookie } from "@/lib/auth";
import { ensurePrescriptionSchemaColumns } from "@/lib/prescription-schema";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSessionUserFromCookie();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  await ensurePrescriptionSchemaColumns();

  const [rows] = await pool.query(
    `SELECT id, image_name, doctor_name, doctor_advice, diagnosis, prescription_date, treatment_start_date, treatment_end_date,
            medicines_json, ai_summary, created_at
     FROM prescriptions WHERE user_id = ? ORDER BY created_at DESC`,
    [session.id]
  );
  return NextResponse.json({ items: rows });
}

export async function POST(req: NextRequest) {
  const session = await getSessionUserFromCookie();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  await ensurePrescriptionSchemaColumns();

  const body = await req.json();
  const {
    image_name,
    doctor_name,
    doctor_advice,
    diagnosis,
    prescription_date,
    treatment_start_date,
    treatment_end_date,
    medicines_json,
    ai_summary,
  } = body;

  const toNullableText = (value: unknown) => {
    if (value === null || value === undefined) return null;
    if (Array.isArray(value)) {
      const joined = value.map((v) => String(v)).join("\n");
      return joined || null;
    }
    const text = String(value);
    return text.length ? text : null;
  };

  const normalizedMedicines =
    typeof medicines_json === "string"
      ? medicines_json
      : JSON.stringify(Array.isArray(medicines_json) ? medicines_json : []);

  await pool.query(
    `INSERT INTO prescriptions
      (user_id, image_name, doctor_name, doctor_advice, diagnosis, prescription_date, treatment_start_date, treatment_end_date, medicines_json, ai_summary)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      session.id,
      toNullableText(image_name),
      toNullableText(doctor_name),
      toNullableText(doctor_advice),
      toNullableText(diagnosis),
      toNullableText(prescription_date),
      toNullableText(treatment_start_date),
      toNullableText(treatment_end_date),
      normalizedMedicines,
      toNullableText(ai_summary),
    ]
  );

  return NextResponse.json({ ok: true });
}
