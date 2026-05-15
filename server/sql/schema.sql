CREATE DATABASE IF NOT EXISTS immunotrace;
USE immunotrace;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS prescriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  image_name VARCHAR(255) NULL,
  doctor_name VARCHAR(255) NULL,
  doctor_advice TEXT NULL,
  diagnosis TEXT NULL,
  prescription_date DATE NULL,
  treatment_start_date DATE NULL,
  treatment_end_date DATE NULL,
  medicines_json JSON NULL,
  ai_summary TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_prescriptions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS diet_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  goal VARCHAR(120) NOT NULL,
  allergies TEXT NULL,
  preferences_json JSON NULL,
  plan_json JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_diet_plans_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

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
);

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
);

SET @col_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'prescriptions' AND COLUMN_NAME = 'doctor_advice'
);
SET @ddl := IF(@col_exists = 0, 'ALTER TABLE prescriptions ADD COLUMN doctor_advice TEXT NULL', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'prescriptions' AND COLUMN_NAME = 'treatment_start_date'
);
SET @ddl := IF(@col_exists = 0, 'ALTER TABLE prescriptions ADD COLUMN treatment_start_date DATE NULL', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'prescriptions' AND COLUMN_NAME = 'treatment_end_date'
);
SET @ddl := IF(@col_exists = 0, 'ALTER TABLE prescriptions ADD COLUMN treatment_end_date DATE NULL', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'prescriptions' AND COLUMN_NAME = 'ai_summary'
);
SET @ddl := IF(@col_exists = 0, 'ALTER TABLE prescriptions ADD COLUMN ai_summary TEXT NULL', 'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
