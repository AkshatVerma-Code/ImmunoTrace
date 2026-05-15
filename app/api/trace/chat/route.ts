import { NextRequest, NextResponse } from "next/server";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { getSessionUserFromCookie } from "@/lib/auth";
import { pool } from "@/lib/db";
import { ensureTraceSchema } from "@/lib/trace-schema";
import { buildTraceContextForUser } from "@/lib/health-context";
import { generateAiHealthSummaryWithGemini, generateTraceReplyWithGemini } from "@/lib/gemini";
import { extractImageHealthContextWithMistral } from "@/lib/mistral";

export const runtime = "nodejs";

type IncomingAttachment = {
  file_name?: unknown;
  mime_type?: unknown;
  data_url?: unknown;
  text_content?: unknown;
};

type MessageRow = RowDataPacket & {
  id: number;
  role: "user" | "trace";
  text: string;
  created_at: string;
};

type AttachmentRow = RowDataPacket & {
  message_id: number;
  file_name: string;
  mime_type: string | null;
  extracted_text: string | null;
};

const SERIOUS_PATTERNS: RegExp[] = [
  /\b(chest pain|chest pressure|heart pain)\b/i,
  /\b(shortness of breath|breathing trouble|cannot breathe|breathless)\b/i,
  /\b(faint|fainted|fainting|passed out|unconscious)\b/i,
  /\b(seizure|convulsion)\b/i,
  /\b(stroke|face drooping|slurred speech|one side weak)\b/i,
  /\b(vomiting blood|blood in vomit|coughing blood|blood in stool|black stool)\b/i,
  /\b(severe bleeding|bleeding not stopping)\b/i,
  /\b(severe dehydration|no urine|very dry mouth|sunken eyes)\b/i,
  /\b(high fever|fever above 103|fever 104|fever 105|fever for [3-9] days)\b/i,
  /\b(severe headache with vomiting|stiff neck|confusion|disoriented)\b/i,
  /\b(suicidal|self harm|kill myself)\b/i,
];

function shouldEscalateImmediately(message: string): boolean {
  return SERIOUS_PATTERNS.some((pattern) => pattern.test(message));
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sanitizeReply(reply: string, medicineNames: string[]): string {
  let output = reply;
  const blocked = new Set<string>([
    "paracetamol",
    "ibuprofen",
    "amoxicillin",
    "azithromycin",
    "crocin",
    "dolo",
    "antibiotic",
    ...medicineNames.map((name) => name.toLowerCase()),
  ]);

  for (const token of blocked) {
    const term = token.trim();
    if (!term) continue;
    const pattern = new RegExp(`\\b${escapeRegex(term)}\\b`, "gi");
    output = output.replace(pattern, "doctor-prescribed medicine");
  }

  return output;
}

function clip(text: string, limit: number) {
  if (text.length <= limit) return text;
  return `${text.slice(0, limit)}...`;
}

function parseDataUrlBase64(dataUrl: string): string | null {
  const idx = dataUrl.indexOf(",");
  if (idx === -1) return null;
  const header = dataUrl.slice(0, idx);
  if (!/;base64$/i.test(header)) return null;
  return dataUrl.slice(idx + 1);
}

function normalizeAttachments(value: unknown): IncomingAttachment[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 5).map((item) => {
    const attachment = item as IncomingAttachment;
    return {
      file_name: attachment?.file_name,
      mime_type: attachment?.mime_type,
      data_url: attachment?.data_url,
      text_content: attachment?.text_content,
    };
  });
}

function buildChatTitle(message: string): string {
  const title = message.replace(/\s+/g, " ").trim();
  if (!title) return "New Trace chat";
  return title.length > 70 ? `${title.slice(0, 70)}...` : title;
}

async function resolveChatId(userId: number, requestedChatId: unknown, message: string): Promise<number> {
  const chatId = Number(requestedChatId);
  if (Number.isFinite(chatId) && chatId > 0) {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM trace_chats WHERE id = ? AND user_id = ? LIMIT 1`,
      [chatId, userId]
    );
    if (rows.length > 0) return chatId;
  }

  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO trace_chats (user_id, title) VALUES (?, ?)`,
    [userId, buildChatTitle(message)]
  );
  return result.insertId;
}

async function persistUserAttachments(
  userId: number,
  chatId: number,
  messageId: number,
  attachments: IncomingAttachment[]
) {
  const summaries: string[] = [];

  for (const rawAttachment of attachments) {
    const fileName =
      typeof rawAttachment.file_name === "string" && rawAttachment.file_name.trim()
        ? clip(rawAttachment.file_name.trim(), 255)
        : "uploaded-file";
    const mimeType =
      typeof rawAttachment.mime_type === "string" && rawAttachment.mime_type.trim()
        ? clip(rawAttachment.mime_type.trim(), 120)
        : null;
    const dataUrl =
      typeof rawAttachment.data_url === "string" && rawAttachment.data_url.length > 0
        ? clip(rawAttachment.data_url, 1_500_000)
        : null;
    const textContent =
      typeof rawAttachment.text_content === "string" && rawAttachment.text_content.trim()
        ? clip(rawAttachment.text_content.trim(), 8000)
        : "";

    let extractedText = textContent;

    if (!extractedText && mimeType?.startsWith("image/") && dataUrl) {
      try {
        const imageBase64 = parseDataUrlBase64(dataUrl);
        if (imageBase64) {
          const imageContext = await extractImageHealthContextWithMistral(imageBase64);
          const contextLine = [
            typeof imageContext.medicine_related === "boolean"
              ? `Medicine related: ${imageContext.medicine_related ? "yes" : "no"}`
              : "",
            imageContext.item_name ? `Item: ${imageContext.item_name}` : "",
            imageContext.short_summary ? `Summary: ${imageContext.short_summary}` : "",
            imageContext.extracted_text ? `Extracted text: ${imageContext.extracted_text}` : "",
          ]
            .filter(Boolean)
            .join(" | ");
          extractedText = clip(contextLine || "", 8000);
        }
      } catch {
        // Keep upload flow non-blocking when OCR extraction fails.
      }
    }

    await pool.query(
      `INSERT INTO trace_attachments
       (user_id, chat_id, message_id, file_name, mime_type, data_url, extracted_text)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, chatId, messageId, fileName, mimeType, dataUrl, extractedText || null]
    );

    const summaryParts = [
      `File: ${fileName}`,
      mimeType ? `Type: ${mimeType}` : "",
      extractedText ? `Extracted context: ${clip(extractedText, 700)}` : "No readable context extracted.",
    ].filter(Boolean);
    summaries.push(summaryParts.join(" | "));
  }

  return summaries;
}

async function loadConversationForChat(userId: number, chatId: number) {
  const [messageRows] = await pool.query<MessageRow[]>(
    `SELECT id, role, text, created_at
     FROM trace_messages
     WHERE user_id = ? AND chat_id = ?
     ORDER BY created_at DESC
     LIMIT 30`,
    [userId, chatId]
  );
  const orderedMessages = [...messageRows].reverse();

  const messageIds = orderedMessages.map((row) => row.id);
  let attachmentRows: AttachmentRow[] = [];
  if (messageIds.length > 0) {
    const placeholders = messageIds.map(() => "?").join(",");
    const [rows] = await pool.query<AttachmentRow[]>(
      `SELECT message_id, file_name, mime_type, extracted_text
       FROM trace_attachments
       WHERE message_id IN (${placeholders})
       ORDER BY created_at ASC`,
      messageIds
    );
    attachmentRows = rows;
  }

  const attachmentsByMessage = new Map<number, AttachmentRow[]>();
  for (const row of attachmentRows) {
    const current = attachmentsByMessage.get(row.message_id) || [];
    current.push(row);
    attachmentsByMessage.set(row.message_id, current);
  }

  const recentUserRows = orderedMessages.filter((row) => row.role === "user").slice(-6);
  const conversation = recentUserRows.map((row) => {
    const relatedAttachments = attachmentsByMessage.get(row.id) || [];
    const attachmentText = relatedAttachments
      .map((att) => {
        const parts = [
          `Attachment: ${att.file_name}`,
          att.mime_type ? `Type: ${att.mime_type}` : "",
          att.extracted_text ? `Context: ${clip(att.extracted_text, 500)}` : "",
        ].filter(Boolean);
        return parts.join(" | ");
      })
      .filter(Boolean);

    const text = attachmentText.length > 0 ? `${row.text}\n${attachmentText.join("\n")}` : row.text;
    return {
      role: row.role,
      text,
    };
  });

  const attachmentContext = attachmentRows
    .map((att) => att.extracted_text?.trim() || "")
    .filter(Boolean)
    .slice(-15)
    .join("\n");

  return { conversation, attachmentContext };
}

export async function POST(req: NextRequest) {
  const session = await getSessionUserFromCookie();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  await ensureTraceSchema();

  const body = await req.json();
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const attachments = normalizeAttachments(body?.attachments);
  if (!message && attachments.length === 0) {
    return NextResponse.json({ message: "Message or attachment is required." }, { status: 400 });
  }

  const normalizedMessage = message || "User uploaded files/photos and requested analysis.";
  const chatId = await resolveChatId(session.id, body?.chat_id, normalizedMessage);

  const [userMessageInsert] = await pool.query<ResultSetHeader>(
    `INSERT INTO trace_messages (chat_id, user_id, role, text) VALUES (?, ?, 'user', ?)`,
    [chatId, session.id, normalizedMessage]
  );
  const userMessageId = userMessageInsert.insertId;

  const attachmentSummaries = await persistUserAttachments(session.id, chatId, userMessageId, attachments);
  if (attachmentSummaries.length > 0) {
    const enrichedMessage = `${normalizedMessage}\n${attachmentSummaries.join("\n")}`;
    await pool.query(
      `UPDATE trace_messages SET text = ? WHERE id = ? AND user_id = ?`,
      [enrichedMessage, userMessageId, session.id]
    );
  }

  let reply: string;
  if (shouldEscalateImmediately(normalizedMessage)) {
    reply =
      "This sounds serious. Please consult a doctor immediately or go to the nearest hospital/emergency service right now. I cannot safely provide home prevention advice for this situation.";
  } else {
    const context = await buildTraceContextForUser(session.id);
    const aiHealthSummary = await generateAiHealthSummaryWithGemini({
      profile: context.profile,
      medicalRecordsSummary: context.medical_records_summary,
      quickPatternSummary: context.quick_pattern_summary,
    });

    const { conversation, attachmentContext } = await loadConversationForChat(session.id, chatId);
    const rawReply = await generateTraceReplyWithGemini({
      message: normalizedMessage,
      profile: context.profile,
      medicalRecordsSummary: context.medical_records_summary,
      aiHealthSummary,
      quickPatternSummary: context.quick_pattern_summary,
      attachmentContext,
      conversation,
    });

    const medicineNames = context.records
      .flatMap((record) => record.medicines)
      .map((line) => line.split("|")[0]?.trim() || "")
      .filter(Boolean);
    reply = sanitizeReply(rawReply, medicineNames);
  }

  const [traceMessageInsert] = await pool.query<ResultSetHeader>(
    `INSERT INTO trace_messages (chat_id, user_id, role, text) VALUES (?, ?, 'trace', ?)`,
    [chatId, session.id, reply]
  );

  await pool.query(`UPDATE trace_chats SET updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`, [
    chatId,
    session.id,
  ]);

  return NextResponse.json({
    chat_id: chatId,
    user_message_id: userMessageId,
    trace_message_id: traceMessageInsert.insertId,
    reply,
  });
}
