import { NextRequest, NextResponse } from "next/server";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { getSessionUserFromCookie } from "@/lib/auth";
import { pool } from "@/lib/db";
import { ensureScheduleSchema } from "@/lib/schedule-schema";

export const runtime = "nodejs";

type AppointmentRow = RowDataPacket & {
  id: number;
  doctor_name: string;
  hospital_name: string;
  appointment_date: string;
  appointment_time: string;
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

async function selectAppointment(userId: number, appointmentId: number) {
  const [rows] = await pool.query<AppointmentRow[]>(
    `SELECT
        id,
        doctor_name,
        hospital_name,
        DATE_FORMAT(appointment_at, '%Y-%m-%d') AS appointment_date,
        DATE_FORMAT(appointment_at, '%H:%i') AS appointment_time,
        DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at
      FROM doctor_appointments
      WHERE id = ? AND user_id = ?
      LIMIT 1`,
    [appointmentId, userId]
  );
  return rows[0] || null;
}

export async function GET() {
  const session = await getSessionUserFromCookie();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  await ensureScheduleSchema();

  const [rows] = await pool.query<AppointmentRow[]>(
    `SELECT
        id,
        doctor_name,
        hospital_name,
        DATE_FORMAT(appointment_at, '%Y-%m-%d') AS appointment_date,
        DATE_FORMAT(appointment_at, '%H:%i') AS appointment_time,
        DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at
      FROM doctor_appointments
      WHERE user_id = ?
      ORDER BY appointment_at ASC`,
    [session.id]
  );

  return NextResponse.json({ items: rows });
}

export async function POST(req: NextRequest) {
  const session = await getSessionUserFromCookie();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  await ensureScheduleSchema();

  const body = await req.json();
  const doctorName = normalizeText(body?.doctor_name, 255);
  const hospitalName = normalizeText(body?.hospital_name, 255);
  const appointmentDate = normalizeText(body?.appointment_date, 10);
  const appointmentTime = normalizeText(body?.appointment_time, 5);

  if (!doctorName) {
    return NextResponse.json({ message: "Doctor name is required." }, { status: 400 });
  }
  if (!hospitalName) {
    return NextResponse.json({ message: "Hospital name is required." }, { status: 400 });
  }
  if (!parseDateStrict(appointmentDate)) {
    return NextResponse.json({ message: "Invalid appointment date." }, { status: 400 });
  }
  if (!isValidTime(appointmentTime)) {
    return NextResponse.json({ message: "Invalid appointment time." }, { status: 400 });
  }

  const appointmentAt = `${appointmentDate} ${appointmentTime}:00`;
  const [insertResult] = await pool.query<ResultSetHeader>(
    `INSERT INTO doctor_appointments (user_id, doctor_name, hospital_name, appointment_at)
     VALUES (?, ?, ?, ?)`,
    [session.id, doctorName, hospitalName, appointmentAt]
  );

  const saved = await selectAppointment(session.id, insertResult.insertId);
  if (!saved) {
    return NextResponse.json({ message: "Appointment was saved but could not be loaded." }, { status: 500 });
  }

  return NextResponse.json({ item: saved }, { status: 201 });
}
