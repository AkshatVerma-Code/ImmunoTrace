import { RowDataPacket } from "mysql2";
import { pool } from "@/lib/db";
import { ensurePrescriptionSchemaColumns } from "@/lib/prescription-schema";

type UserRow = RowDataPacket & {
  id: number;
  name: string | null;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  blood_group: string | null;
  allergies: string | null;
  location: string | null;
  health_score: number | null;
};

type PrescriptionRow = RowDataPacket & {
  id: number;
  doctor_name: string | null;
  doctor_advice: string | null;
  diagnosis: string | null;
  prescription_date: string | null;
  treatment_start_date: string | null;
  treatment_end_date: string | null;
  medicines_json: unknown;
  ai_summary: string | null;
  created_at: string;
};

export type TraceProfileContext = {
  name: string;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  blood_group: string | null;
  allergies: string | null;
  location: string | null;
  health_score: number | null;
};

export type TraceRecordContext = {
  id: number;
  date: string;
  disease: string;
  medicines: string[];
  doctor_name: string;
  doctor_advice: string;
  ai_summary: string;
  treatment_start_date: string | null;
  treatment_end_date: string | null;
};

export type TraceContextBundle = {
  profile: TraceProfileContext;
  records: TraceRecordContext[];
  medical_records_summary: string;
  quick_pattern_summary: string;
};

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

function toDateOnly(value?: string | null): string {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

function normalizeDisease(disease: string): string {
  return disease
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .slice(0, 6)
    .join(" ");
}

function toMedicineLine(med: any): string {
  const name = String(med?.name || "").trim();
  const dosage = String(med?.dosage || "").trim();
  const whenToTake = String(med?.frequency || "").trim();
  const duration = String(med?.duration || "").trim();
  const line = [name, dosage, whenToTake, duration].filter(Boolean).join(" | ");
  return line || "Not available";
}

function buildQuickPatternSummary(records: TraceRecordContext[]): string {
  if (records.length === 0) {
    return "No prescription history is available yet. Use profile-only prevention guidance.";
  }

  const diseaseCounts = new Map<string, number>();
  const feverMonths = new Set<string>();

  for (const record of records) {
    const diseaseKey = normalizeDisease(record.disease || "unknown");
    diseaseCounts.set(diseaseKey, (diseaseCounts.get(diseaseKey) || 0) + 1);

    const date = record.date;
    const monthKey = date ? date.slice(0, 7) : "";
    const diseaseText = (record.disease || "").toLowerCase();
    if (monthKey && (diseaseText.includes("fever") || diseaseText.includes("viral") || diseaseText.includes("cold"))) {
      feverMonths.add(monthKey);
    }
  }

  const recurring = Array.from(diseaseCounts.entries())
    .filter(([key, count]) => key !== "unknown" && count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([key, count]) => `${key} (${count} times)`);

  const lines: string[] = [];
  lines.push(`Total records analysed: ${records.length}.`);
  if (recurring.length > 0) {
    lines.push(`Recurring disease patterns: ${recurring.join(", ")}.`);
  } else {
    lines.push("No strong recurring diagnosis pattern was detected yet.");
  }
  if (feverMonths.size >= 2) {
    lines.push("Fever/viral-like episodes appear across multiple months, including possible seasonal transitions.");
  }
  lines.push("Use prevention-first and lifestyle-safe guidance tailored to Indian routines.");
  return lines.join(" ");
}

function buildMedicalRecordsSummary(records: TraceRecordContext[]): string {
  if (records.length === 0) {
    return "No medical records uploaded yet.";
  }

  return records
    .map((record, index) => {
      return [
        `Medical record ${index + 1}`,
        `Date: ${record.date || "Unknown"}`,
        `Disease: ${record.disease || "Not available"}`,
        `Medicine: ${record.medicines.length > 0 ? record.medicines.join("; ") : "Not available"}`,
        `Doctor advice: ${record.doctor_advice || "Not available"}`,
        `AI summary: ${record.ai_summary || "Not available"}`,
      ].join("\n");
    })
    .join("\n\n");
}

export async function buildTraceContextForUser(userId: number): Promise<TraceContextBundle> {
  await ensurePrescriptionSchemaColumns();

  const [userRows] = await pool.query<UserRow[]>(
    `SELECT id, name, age, height_cm, weight_kg, blood_group, allergies, location, health_score
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [userId]
  );
  const user = userRows[0];
  if (!user) {
    throw new Error("User not found.");
  }

  const [prescriptionRows] = await pool.query<PrescriptionRow[]>(
    `SELECT id, doctor_name, doctor_advice, diagnosis, prescription_date, treatment_start_date, treatment_end_date, medicines_json, ai_summary, created_at
     FROM prescriptions
     WHERE user_id = ?
     ORDER BY COALESCE(prescription_date, created_at) DESC, created_at DESC
     LIMIT 80`,
    [userId]
  );

  const records: TraceRecordContext[] = prescriptionRows.map((row) => {
    const parsedMedicines = parseJsonValue<unknown[]>(row.medicines_json, []);
    const medicineLines = Array.isArray(parsedMedicines) ? parsedMedicines.map((med) => toMedicineLine(med)) : [];

    return {
      id: row.id,
      date: toDateOnly(row.prescription_date || row.created_at),
      disease: String(row.diagnosis || "").trim(),
      medicines: medicineLines,
      doctor_name: String(row.doctor_name || "").trim(),
      doctor_advice: String(row.doctor_advice || "").trim(),
      ai_summary: String(row.ai_summary || "").trim(),
      treatment_start_date: toDateOnly(row.treatment_start_date) || null,
      treatment_end_date: toDateOnly(row.treatment_end_date) || null,
    };
  });

  const profile: TraceProfileContext = {
    name: String(user.name || "User").trim() || "User",
    age: user.age ?? null,
    height_cm: user.height_cm ?? null,
    weight_kg: user.weight_kg ?? null,
    blood_group: user.blood_group ?? null,
    allergies: user.allergies ?? null,
    location: user.location ?? null,
    health_score: user.health_score ?? null,
  };

  const medical_records_summary = buildMedicalRecordsSummary(records);
  const quick_pattern_summary = buildQuickPatternSummary(records);

  return {
    profile,
    records,
    medical_records_summary,
    quick_pattern_summary,
  };
}
