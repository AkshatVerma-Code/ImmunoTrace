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

type LastMessageRow = RowDataPacket & {
  chat_id: number;
  text: string;
  created_at: string;
};

export async function GET() {
  const session = await getSessionUserFromCookie();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  await ensureTraceSchema();

  const [chatRows] = await pool.query<ChatRow[]>(
    `SELECT id, title, created_at, updated_at
     FROM trace_chats
     WHERE user_id = ?
     ORDER BY updated_at DESC
     LIMIT 40`,
    [session.id]
  );

  if (chatRows.length === 0) {
    return NextResponse.json({ chats: [] });
  }

  const chatIds = chatRows.map((row) => row.id);
  const placeholders = chatIds.map(() => "?").join(",");
  const [lastRows] = await pool.query<LastMessageRow[]>(
    `SELECT m.chat_id, m.text, m.created_at
     FROM trace_messages m
     JOIN (
       SELECT chat_id, MAX(created_at) AS max_created_at
       FROM trace_messages
       WHERE chat_id IN (${placeholders})
       GROUP BY chat_id
     ) latest
     ON m.chat_id = latest.chat_id AND m.created_at = latest.max_created_at`,
    chatIds
  );

  const lastMap = new Map<number, LastMessageRow>();
  for (const row of lastRows) {
    if (!lastMap.has(row.chat_id)) {
      lastMap.set(row.chat_id, row);
    }
  }

  return NextResponse.json({
    chats: chatRows.map((chat) => ({
      id: chat.id,
      title: chat.title,
      created_at: chat.created_at,
      updated_at: chat.updated_at,
      last_message: lastMap.get(chat.id)?.text || "",
      last_message_at: lastMap.get(chat.id)?.created_at || null,
    })),
  });
}
