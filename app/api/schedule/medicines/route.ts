import { NextRequest, NextResponse } from "next/server";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { getSessionUserFromCookie } from "@/lib/auth";
import { pool } from "@/lib/db";
import { ensureScheduleSchema } from "@/lib/schedule-schema";

export const runtime = "nodejs";

type ReminderRow = RowDataPacket & {
  id: number;
  medicine_name: string;
  when_to_take: string | null;
  start_date: string;
  end_date: string;
  times_json: unknown;
  created_at: string;
};

function normalizeText(value: unknown, maxLen: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLen) : "";
}

function isValidDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}

function parseDateStrict(value: string): Date | null {
  if (!isValidDate(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);
  if (Number.isNaN(parsed.getTime())) return null;
  if (parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day) return null;
  return parsed;
}

function parseTimesJson(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(isValidTime);
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map((item) => String(item)).filter(isValidTime) : [];
    } catch {
      return [];
    }
  }
  if (Buffer.isBuffer(value)) {
    try {
      const parsed = JSON.parse(value.toString("utf8"));
      return Array.isArray(parsed) ? parsed.map((item) => String(item)).filter(isValidTime) : [];
    } catch {
      return [];
    }
  }
  if (value && typeof value === "object") {
    return parseTimesJson(JSON.stringify(value));
  }
  return [];
}

function normalizeTimes(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const normalized = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => isValidTime(item));
  return Array.from(new Set(normalized)).slice(0, 8);
}

function mapReminderRow(row: ReminderRow) {
  return {
    id: row.id,
    medicine_name: row.medicine_name,
    when_to_take: row.when_to_take,
    start_date: row.start_date,
    end_date: row.end_date,
    times: parseTimesJson(row.times_json),
    created_at: row.created_at,
  };
}

async function selectReminder(userId: number, reminderId: number) {
  const [rows] = await pool.query<ReminderRow[]>(
    `SELECT
        id,
        medicine_name,
        when_to_take,
        DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
        DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date,
        times_json,
        DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at
      FROM medicine_reminders
      WHERE id = ? AND user_id = ?
      LIMIT 1`,
    [reminderId, userId]
  );
  return rows[0] || null;
}

export async function GET() {
  const session = await getSessionUserFromCookie();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  await ensureScheduleSchema();

  const [rows] = await pool.query<ReminderRow[]>(
    `SELECT
        id,
        medicine_name,
        when_to_take,
        DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
        DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date,
        times_json,
        DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at
      FROM medicine_reminders
      WHERE user_id = ?
      ORDER BY created_at DESC`,
    [session.id]
  );

  return NextResponse.json({ items: rows.map(mapReminderRow) });
}

export async function POST(req: NextRequest) {
  const session = await getSessionUserFromCookie();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  await ensureScheduleSchema();

  const body = await req.json();
  const medicineName = normalizeText(body?.medicine_name, 255);
  const whenToTakeRaw = normalizeText(body?.when_to_take, 80);
  const startDate = normalizeText(body?.start_date, 10);
  const endDate = normalizeText(body?.end_date, 10);
  const times = normalizeTimes(body?.times);

  if (!medicineName) {
    return NextResponse.json({ message: "Medicine name is required." }, { status: 400 });
  }
  const parsedStart = parseDateStrict(startDate);
  const parsedEnd = parseDateStrict(endDate);
  if (!parsedStart || !parsedEnd) {
    return NextResponse.json({ message: "Valid start and end dates are required." }, { status: 400 });
  }
  if (parsedEnd < parsedStart) {
    return NextResponse.json({ message: "End date must be on or after start date." }, { status: 400 });
  }
  if (times.length === 0) {
    return NextResponse.json({ message: "At least one valid reminder time is required." }, { status: 400 });
  }

  const [insertResult] = await pool.query<ResultSetHeader>(
    `INSERT INTO medicine_reminders (user_id, medicine_name, when_to_take, start_date, end_date, times_json)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [session.id, medicineName, whenToTakeRaw || null, startDate, endDate, JSON.stringify(times)]
  );

  const saved = await selectReminder(session.id, insertResult.insertId);
  if (!saved) {
    return NextResponse.json({ message: "Reminder was saved but could not be loaded." }, { status: 500 });
  }

  return NextResponse.json({ item: mapReminderRow(saved) }, { status: 201 });
}
