import { NextResponse } from "next/server";
import { RowDataPacket } from "mysql2";
import { getSessionUserFromCookie } from "@/lib/auth";
import { pool } from "@/lib/db";
import { ensureTraceSchema } from "@/lib/trace-schema";

export const runtime = "nodejs";

type ChatRow = RowDataPacket & {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
};

type MessageRow = RowDataPacket & {
  id: number;
  role: "user" | "trace";
  text: string;
  created_at: string;
};

type AttachmentRow = RowDataPacket & {
  id: number;
  message_id: number;
  file_name: string;
  mime_type: string | null;
  extracted_text: string | null;
  created_at: string;
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const session = await getSessionUserFromCookie();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  await ensureTraceSchema();

  const { chatId: chatIdParam } = await params;
  const chatId = Number(chatIdParam);
  if (!Number.isFinite(chatId) || chatId <= 0) {
    return NextResponse.json({ message: "Invalid chat id." }, { status: 400 });
  }

  const [chatRows] = await pool.query<ChatRow[]>(
    `SELECT id, title, created_at, updated_at
     FROM trace_chats
     WHERE id = ? AND user_id = ?
     LIMIT 1`,
    [chatId, session.id]
  );
  const chat = chatRows[0];
  if (!chat) {
    return NextResponse.json({ message: "Chat not found." }, { status: 404 });
  }

  const [messageRows] = await pool.query<MessageRow[]>(
    `SELECT id, role, text, created_at
     FROM trace_messages
     WHERE chat_id = ? AND user_id = ?
     ORDER BY created_at ASC
     LIMIT 500`,
    [chatId, session.id]
  );

  const messageIds = messageRows.map((row) => row.id);
  let attachmentRows: AttachmentRow[] = [];
  if (messageIds.length > 0) {
    const placeholders = messageIds.map(() => "?").join(",");
    const [rows] = await pool.query<AttachmentRow[]>(
      `SELECT id, message_id, file_name, mime_type, extracted_text, created_at
       FROM trace_attachments
       WHERE message_id IN (${placeholders})
       ORDER BY created_at ASC`,
      messageIds
    );
    attachmentRows = rows;
  }

  const attachmentMap = new Map<number, AttachmentRow[]>();
  for (const row of attachmentRows) {
    const bucket = attachmentMap.get(row.message_id) || [];
    bucket.push(row);
    attachmentMap.set(row.message_id, bucket);
  }

  return NextResponse.json({
    chat: {
      id: chat.id,
      title: chat.title,
      created_at: chat.created_at,
      updated_at: chat.updated_at,
    },
    messages: messageRows.map((msg) => ({
      id: msg.id,
      role: msg.role,
      text: msg.text,
      created_at: msg.created_at,
      attachments: (attachmentMap.get(msg.id) || []).map((att) => ({
        id: att.id,
        file_name: att.file_name,
        mime_type: att.mime_type,
        extracted_text: att.extracted_text,
        created_at: att.created_at,
      })),
    })),
  });
}
