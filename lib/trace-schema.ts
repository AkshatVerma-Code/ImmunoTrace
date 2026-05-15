import { pool } from "@/lib/db";

let schemaEnsured = false;

export async function ensureTraceSchema() {
  if (schemaEnsured) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS trace_chats (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_trace_chats_user_updated (user_id, updated_at),
      CONSTRAINT fk_trace_chats_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS trace_messages (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      chat_id BIGINT NOT NULL,
      user_id INT NOT NULL,
      role ENUM('user','trace') NOT NULL,
      text LONGTEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_trace_messages_chat_created (chat_id, created_at),
      CONSTRAINT fk_trace_messages_chat FOREIGN KEY (chat_id) REFERENCES trace_chats(id) ON DELETE CASCADE,
      CONSTRAINT fk_trace_messages_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS trace_attachments (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      chat_id BIGINT NOT NULL,
      message_id BIGINT NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      mime_type VARCHAR(120) NULL,
      data_url LONGTEXT NULL,
      extracted_text LONGTEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_trace_attachments_chat_created (chat_id, created_at),
      CONSTRAINT fk_trace_attachments_chat FOREIGN KEY (chat_id) REFERENCES trace_chats(id) ON DELETE CASCADE,
      CONSTRAINT fk_trace_attachments_message FOREIGN KEY (message_id) REFERENCES trace_messages(id) ON DELETE CASCADE,
      CONSTRAINT fk_trace_attachments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  schemaEnsured = true;
}
