import { NextRequest, NextResponse } from "next/server";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { getSessionUserFromCookie } from "@/lib/auth";
import { pool } from "@/lib/db";
import { generateDietPlanWithGemini } from "@/lib/gemini";
import { ensurePrescriptionSchemaColumns } from "@/lib/prescription-schema";

export const runtime = "nodejs";

type PrescriptionRow = RowDataPacket & {
  id: number;
  image_name: string | null;
  doctor_name: string | null;
  diagnosis: string | null;
  ai_summary: string | null;
  prescription_date: string | null;
  treatment_end_date: string | null;
  medicines_json: unknown;
  created_at: string;
};

type UserProfileRow = RowDataPacket & {
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  blood_group: string | null;
  allergies: string | null;
  health_score: number | null;
  location: string | null;
};

type DietPlanRow = RowDataPacket & {
  id: number;
  goal: string;
  preferences_json: unknown;
  plan_json: unknown;
  created_at: string;
};

type CareStatus = "active" | "recently_cured" | "old_cured";

function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeDate(value?: string | null): string {
  const parsed = parseDate(value);
  return parsed ? parsed.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
}

function parseJsonValue<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") {
    if (!value.trim()) return fallback;
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  if (Buffer.isBuffer(value)) {
    const text = value.toString("utf8");
    if (!text.trim()) return fallback;
    try {
      return JSON.parse(text) as T;
    } catch {
      return fallback;
    }
  }
  if (typeof value === "object") return value as T;
  return fallback;
}

function parseMedicines(value: unknown) {
  try {
    const parsed = parseJsonValue<unknown>(value, []);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseDurationToDays(duration?: string): number | null {
  if (!duration) return null;
  const text = duration.toLowerCase();
  const match = text.match(/(\d+)\s*(day|days|week|weeks|month|months)/);
  if (!match) return null;
  const value = Number(match[1]);
  if (Number.isNaN(value) || value <= 0) return null;
  const unit = match[2];
  if (unit.startsWith("week")) return value * 7;
  if (unit.startsWith("month")) return value * 30;
  return value;
}

function getInferredTreatmentEndDate(row: PrescriptionRow): Date | null {
  const explicitEndDate = parseDate(row.treatment_end_date);
  if (explicitEndDate) return explicitEndDate;

  const startDate = parseDate(row.prescription_date || row.created_at);
  if (!startDate) return null;

  const medicines = parseMedicines(row.medicines_json);
  const maxDurationDays = medicines.reduce((max: number, med: any) => {
    const durationDays = parseDurationToDays(typeof med?.duration === "string" ? med.duration : "");
    return durationDays && durationDays > max ? durationDays : max;
  }, 0);

  if (!maxDurationDays) return null;
  const inferred = new Date(startDate);
  inferred.setDate(inferred.getDate() + maxDurationDays);
  return inferred;
}

function classifyPrescription(row: PrescriptionRow): CareStatus {
  const endDate = getInferredTreatmentEndDate(row);
  if (!endDate) return "active";
  const now = new Date();
  const diffMs = now.getTime() - endDate.getTime();
  const daysSinceCured = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return daysSinceCured <= 7 ? "recently_cured" : "old_cured";
}

function mapDietPlanRow(row: DietPlanRow) {
  const parsedPreferences = parseJsonValue<unknown>(row.preferences_json, []);
  const preferences = Array.isArray(parsedPreferences) ? parsedPreferences.map((v) => String(v)) : [];
  const plan = parseJsonValue<any | null>(row.plan_json, null);

  return {
    id: row.id,
    goal: row.goal,
    preferences,
    created_at: row.created_at,
    plan,
  };
}

export async function GET() {
  const session = await getSessionUserFromCookie();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const [rows] = await pool.query<DietPlanRow[]>(
    `SELECT id, goal, preferences_json, plan_json, created_at
     FROM diet_plans
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [session.id]
  );

  return NextResponse.json({ items: rows.map(mapDietPlanRow) });
}

export async function POST(req: NextRequest) {
  const session = await getSessionUserFromCookie();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  await ensurePrescriptionSchemaColumns();

  const body = await req.json();
  const goal = typeof body?.goal === "string" && body.goal.trim() ? body.goal.trim() : "Balanced wellness";
  const preferences = Array.isArray(body?.preferences)
    ? body.preferences.map((item: unknown) => String(item).trim()).filter(Boolean)
    : [];
  const notes = typeof body?.notes === "string" ? body.notes.trim() : "";

  const [profileRows] = await pool.query<UserProfileRow[]>(
    `SELECT age, height_cm, weight_kg, blood_group, allergies, health_score, location
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [session.id]
  );
  const profile = profileRows[0];

  const [prescriptionRows] = await pool.query<PrescriptionRow[]>(
    `SELECT id, image_name, doctor_name, diagnosis, ai_summary, prescription_date, treatment_end_date, medicines_json, created_at
     FROM prescriptions
     WHERE user_id = ?
     ORDER BY prescription_date DESC, created_at DESC`,
    [session.id]
  );

  const relevantPrescriptions = prescriptionRows.filter((row) => {
    const status = classifyPrescription(row);
    return status === "active" || status === "recently_cured";
  });

  const healthRecords = relevantPrescriptions.map((row) => {
    const status = classifyPrescription(row);
    const summaryPrefix = status === "active" ? "Active treatment" : "Recently cured within 7 days";
    const inferredEndDate = getInferredTreatmentEndDate(row);
    return {
      image_name: row.image_name,
      doctor_name: row.doctor_name,
      diagnosis: row.diagnosis,
      ai_summary: row.ai_summary ? `${summaryPrefix}: ${row.ai_summary}` : summaryPrefix,
      prescription_date: normalizeDate(row.prescription_date || row.created_at),
      treatment_start_date: null,
      treatment_end_date: inferredEndDate ? inferredEndDate.toISOString().slice(0, 10) : null,
      is_active: status === "active",
      recently_cured: status === "recently_cured",
      created_at: row.created_at,
      medicines: parseMedicines(row.medicines_json).map((med: any) => ({
        name: String(med?.name || ""),
        dosage: med?.dosage ? String(med.dosage) : undefined,
        frequency: med?.frequency ? String(med.frequency) : undefined,
        duration: med?.duration ? String(med.duration) : undefined,
      })),
    };
  });

  const allContextText = relevantPrescriptions
    .map((row) => `${row.diagnosis || ""} ${row.ai_summary || ""}`.toLowerCase())
    .join(" ");

  const hemoglobin_values = Array.from(
    allContextText.matchAll(/hemoglobin[^0-9]*([0-9]+(?:\.[0-9]+)?)/g)
  ).map((match) => Number(match[1]));
  const low_hemoglobin_values = hemoglobin_values.filter((value) => value < 12);
  const anemia_mentions = (allContextText.match(/anemia|anaemia/g) || []).length;
  const low_hemoglobin_trend = low_hemoglobin_values.length > 0 || anemia_mentions > 0;

  const healthInsights = {
    low_hemoglobin_trend,
    hemoglobin_values,
    low_hemoglobin_values,
    anemia_mentions,
    supporting_notes: relevantPrescriptions
      .filter((row) => {
        const text = `${row.diagnosis || ""} ${row.ai_summary || ""}`.toLowerCase();
        return text.includes("hemoglobin") || text.includes("anemia") || text.includes("anaemia");
      })
      .slice(0, 10)
      .map((row) => `${normalizeDate(row.prescription_date || row.created_at)}: ${row.diagnosis || row.ai_summary || "Clinical note"}`),
  };

  const plan = await generateDietPlanWithGemini({
    goal,
    preferences,
    notes,
    userProfile: {
      age: profile?.age ?? null,
      height_cm: profile?.height_cm ?? null,
      weight_kg: profile?.weight_kg ?? null,
      blood_group: profile?.blood_group ?? null,
      allergies: profile?.allergies ?? null,
      health_score: profile?.health_score ?? null,
      location: profile?.location ?? null,
    },
    healthRecords,
    healthInsights,
  });

  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO diet_plans (user_id, goal, preferences_json, plan_json)
     VALUES (?, ?, ?, ?)`,
    [session.id, goal, JSON.stringify(preferences), JSON.stringify(plan)]
  );

  const [savedRows] = await pool.query<DietPlanRow[]>(
    `SELECT id, goal, preferences_json, plan_json, created_at
     FROM diet_plans
     WHERE id = ? AND user_id = ?
     LIMIT 1`,
    [result.insertId, session.id]
  );

  const saved = savedRows[0];
  if (!saved) {
    return NextResponse.json({ message: "Diet plan was generated but could not be loaded." }, { status: 500 });
  }
  return NextResponse.json({ item: mapDietPlanRow(saved) });
}
