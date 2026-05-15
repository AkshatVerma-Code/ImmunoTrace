import { pool } from "@/lib/db";

let schemaEnsured = false;

export async function ensureScheduleSchema() {
  if (schemaEnsured) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS doctor_appointments (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      doctor_name VARCHAR(255) NOT NULL,
      hospital_name VARCHAR(255) NOT NULL,
      appointment_at DATETIME NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_doctor_appointments_user_time (user_id, appointment_at),
      CONSTRAINT fk_doctor_appointments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS medicine_reminders (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      medicine_name VARCHAR(255) NOT NULL,
      when_to_take VARCHAR(80) NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      times_json JSON NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_medicine_reminders_user_dates (user_id, start_date, end_date),
      CONSTRAINT fk_medicine_reminders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  schemaEnsured = true;
}
