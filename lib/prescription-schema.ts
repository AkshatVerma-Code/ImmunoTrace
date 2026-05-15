import { pool } from "@/lib/db";
import { RowDataPacket } from "mysql2";

let schemaEnsured = false;

const PRESCRIPTION_COLUMNS: Array<{ name: string; ddl: string }> = [
  { name: "doctor_advice", ddl: "TEXT NULL" },
  { name: "treatment_start_date", ddl: "DATE NULL" },
  { name: "treatment_end_date", ddl: "DATE NULL" },
  { name: "ai_summary", ddl: "TEXT NULL" },
];

export async function ensurePrescriptionSchemaColumns() {
  if (schemaEnsured) return;

  const [rows] = await pool.query<(RowDataPacket & { COLUMN_NAME: string })[]>(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'prescriptions'`
  );

  const existing = new Set(rows.map((row) => row.COLUMN_NAME));
  for (const column of PRESCRIPTION_COLUMNS) {
    if (existing.has(column.name)) continue;
    await pool.query(`ALTER TABLE prescriptions ADD COLUMN ${column.name} ${column.ddl}`);
  }

  schemaEnsured = true;
}
