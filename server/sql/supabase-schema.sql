-- Supabase / PostgreSQL Schema
-- Run this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(120) NOT NULL,
  age INT NULL,
  blood_group VARCHAR(10) NULL,
  height_cm FLOAT NULL,
  weight_kg FLOAT NULL,
  allergies TEXT NULL,
  location VARCHAR(255) NULL,
  phone VARCHAR(30) NULL,
  health_score FLOAT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS prescriptions (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  image_name VARCHAR(255) NULL,
  doctor_name VARCHAR(255) NULL,
  doctor_advice TEXT NULL,
  diagnosis TEXT NULL,
  prescription_date DATE NULL,
  treatment_start_date DATE NULL,
  treatment_end_date DATE NULL,
  medicines_json JSONB NULL,
  ai_summary TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_prescriptions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS diet_plans (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  goal VARCHAR(120) NOT NULL,
  allergies TEXT NULL,
  preferences_json JSONB NULL,
  plan_json JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_diet_plans_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS doctor_appointments (
  id BIGSERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  doctor_name VARCHAR(255) NOT NULL,
  hospital_name VARCHAR(255) NOT NULL,
  appointment_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_doctor_appointments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_doctor_appointments_user_time ON doctor_appointments (user_id, appointment_at);

CREATE TABLE IF NOT EXISTS medicine_reminders (
  id BIGSERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  medicine_name VARCHAR(255) NOT NULL,
  when_to_take VARCHAR(80) NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  times_json JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_medicine_reminders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_medicine_reminders_user_dates ON medicine_reminders (user_id, start_date, end_date);
