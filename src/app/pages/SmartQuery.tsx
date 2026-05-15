import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { useDemoMode } from "../context/DemoContext";
import { Header } from "../components/Header";
import { MessageCircle, Send, Plus, Loader2, Paperclip, Sparkles } from "lucide-react";
import traceImg from "../../imports/Trace.jpeg";

type ChatSummary = {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  last_message: string;
  last_message_at: string | null;
};

type ChatAttachment = {
  id: number;
  file_name: string;
  mime_type: string | null;
  extracted_text: string | null;
  created_at: string;
};

type ChatMessage = {
  id: number;
  role: "user" | "trace";
  text: string;
  created_at: string;
  attachments?: ChatAttachment[];
};

type PendingAttachment = {
  file_name: string;
  mime_type: string;
  data_url?: string;
  text_content?: string;
};

function toLocalTime(value: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

function clip(text: string, limit: number) {
  if (text.length <= limit) return text;
  return `${text.slice(0, limit)}...`;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function isTextMime(mime: string) {
  return (
    mime.startsWith("text/") ||
    mime === "application/json" ||
    mime === "application/xml" ||
    mime === "text/csv"
  );
}

function renderInlineBold(text: string, keyPrefix: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={`${keyPrefix}-b-${index}`} className="font-bold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={`${keyPrefix}-t-${index}`}>{part}</span>;
  });
}

function renderTraceText(text: string) {
  const lines = text.replace(/\r/g, "").split("\n");
  const nodes: ReactNode[] = [];
  let bullets: string[] = [];

  const flushBullets = (key: string) => {
    if (bullets.length === 0) return;
    nodes.push(
      <ul key={`ul-${key}`} className="list-disc pl-5 space-y-1 my-2">
        {bullets.map((item, index) => (
          <li key={`li-${key}-${index}`}>{renderInlineBold(item, `li-${key}-${index}`)}</li>
        ))}
      </ul>
    );
    bullets = [];
  };

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line) {
      flushBullets(String(index));
      return;
    }

    const bulletMatch = line.match(/^[-*]\s+(.+)$/) || line.match(/^\d+[.)]\s+(.+)$/);
    if (bulletMatch) {
      bullets.push(bulletMatch[1].trim());
      return;
    }

    flushBullets(String(index));
    nodes.push(
      <p key={`p-${index}`} className="mb-2 last:mb-0">
        {renderInlineBold(line, `p-${index}`)}
      </p>
    );
  });

  flushBullets("end");
  return nodes.length > 0 ? nodes : <p>{text}</p>;
}

export function SmartQuery() {
  const { isDemoMode } = useDemoMode();
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(false);
  const firstScrollSkippedRef = useRef(false);

  const activeChat = useMemo(
    () => chats.find((chat) => chat.id === activeChatId) || null,
    [chats, activeChatId]
  );

  useEffect(() => {
    if (!firstScrollSkippedRef.current) {
      firstScrollSkippedRef.current = true;
      return;
    }
    if (!shouldAutoScrollRef.current) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    shouldAutoScrollRef.current = false;
  }, [messages, sending]);

  const startNewChat = () => {
    setActiveChatId(null);
    setMessages([]);
    setInput("");
    setPendingAttachments([]);
    setError("");
  };

  const loadChats = async () => {
    setLoadingChats(true);
    setError("");
    try {
      const res = await fetch("/api/trace/chats", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load chats.");
      const chatItems: ChatSummary[] = Array.isArray(data?.chats) ? data.chats : [];
      setChats(chatItems);
      if (chatItems.length === 0) {
        setActiveChatId(null);
        setMessages([]);
      } else if (!activeChatId || !chatItems.some((item) => item.id === activeChatId)) {
        setActiveChatId(chatItems[0].id);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load chats.");
    } finally {
      setLoadingChats(false);
    }
  };

  const loadMessages = async (chatId: number, scrollToBottom = false) => {
    setLoadingMessages(true);
    setError("");
    shouldAutoScrollRef.current = scrollToBottom;
    try {
      const res = await fetch(`/api/trace/chats/${chatId}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load messages.");
      const rows: ChatMessage[] = Array.isArray(data?.messages) ? data.messages : [];
      setMessages(rows);
    } catch (e: any) {
      setError(e?.message || "Failed to load messages.");
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    void loadChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeChatId) return;
    void loadMessages(activeChatId, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChatId]);

  const onAddFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const selected = Array.from(files).slice(0, 5);
    const nextAttachments: PendingAttachment[] = [];

    for (const file of selected) {
      const mime = file.type || "application/octet-stream";
      let dataUrl: string | undefined;
      let textContent: string | undefined;

      if (isTextMime(mime)) {
        try {
          textContent = clip((await readAsText(file)).trim(), 8000);
        } catch {
          textContent = "";
        }
      }

      if (mime.startsWith("image/") || !textContent) {
        try {
          dataUrl = clip(await readAsDataUrl(file), 1_500_000);
        } catch {
          dataUrl = undefined;
        }
      }

      nextAttachments.push({
        file_name: file.name,
        mime_type: mime,
        data_url: dataUrl,
        text_content: textContent,
      });
    }

    setPendingAttachments((prev) => [...prev, ...nextAttachments].slice(0, 5));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removePendingAttachment = (index: number) => {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const sendMessage = async () => {
    if (sending) return;
    const message = input.trim();
    if (!message && pendingAttachments.length === 0) return;

    setSending(true);
    setError("");
    shouldAutoScrollRef.current = true;
    try {
      const res = await fetch("/api/trace/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: activeChatId,
          message,
          attachments: pendingAttachments,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to send message.");

      const nextChatId = Number(data?.chat_id);
      setInput("");
      setPendingAttachments([]);

      await loadChats();
      if (Number.isFinite(nextChatId) && nextChatId > 0) {
        setActiveChatId(nextChatId);
        await loadMessages(nextChatId, true);
      } else if (activeChatId) {
        await loadMessages(activeChatId, true);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen pt-8 pr-8 pb-12 md:pl-28 relative">
      {isDemoMode && (
        <div className="fixed inset-0 pointer-events-none z-0 border-8 border-[#2EC4B6]/20 transition-all duration-500" />
      )}
      <Header />

      <main className="max-w-[1100px] mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <section className="mt-6 mb-6 rounded-[30px] border border-[#2EC4B6]/25 bg-gradient-to-br from-[#0F3D3E] via-[#155758] to-[#1E7475] p-6 text-white shadow-[0_18px_50px_rgba(15,61,62,0.35)] overflow-hidden relative">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#2EC4B6]/20 rounded-full blur-3xl -translate-y-10 translate-x-10" />
            <div className="relative z-10 flex items-center justify-between gap-4">
              <div>
                <motion.h1
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45 }}
                  className="text-4xl md:text-5xl font-black tracking-wider"
                >
                  TRACE
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.45 }}
                  className="mt-2 text-sm text-white/80 max-w-xl"
                >
                  Your prevention-first health companion with concise, structured, and pattern-aware guidance.
                </motion.p>
              </div>
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 2.6, ease: "easeInOut" }}
                className="w-16 h-16 rounded-2xl border border-white/30 overflow-hidden shadow-lg shrink-0"
              >
                <img src={traceImg.src} alt="Trace" className="w-full h-full object-cover scale-110" />
              </motion.div>
            </div>
          </section>

          {error ? (
            <div className="mb-4 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <section className="bg-white/90 backdrop-blur-2xl rounded-[28px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-[#2EC4B6]" />
                <span className="text-sm font-semibold text-slate-700">{activeChat?.title || "New chat"}</span>
              </div>
              <button
                type="button"
                onClick={startNewChat}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 bg-white text-slate-600 hover:border-[#2EC4B6]/40 hover:bg-[#EAF7F6]/40 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                New chat
              </button>
            </div>

            <div className="h-[430px] overflow-y-auto px-5 py-4 bg-slate-50/50 space-y-3">
              {loadingMessages ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Loading chat...
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500">
                  <Sparkles className="w-7 h-7 text-[#2EC4B6] mb-2" />
                  <p className="font-medium">Start a new conversation with Trace.</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                        msg.role === "user"
                          ? "bg-[#0F3D3E] text-white rounded-br-md whitespace-pre-line"
                          : "bg-white border border-slate-100 text-slate-700 rounded-bl-md"
                      }`}
                    >
                      {msg.role === "trace" ? renderTraceText(msg.text) : <p>{msg.text}</p>}
                      {msg.attachments && msg.attachments.length > 0 ? (
                        <div className="mt-2 pt-2 border-t border-slate-200/70 space-y-1">
                          {msg.attachments.map((att) => (
                            <div key={att.id} className="text-[11px]">
                              <span className="font-semibold">{att.file_name}</span>
                              {att.extracted_text ? <p className="opacity-80 mt-0.5">{clip(att.extracted_text, 180)}</p> : null}
                            </div>
                          ))}
                        </div>
                      ) : null}
                      <p className="text-[10px] opacity-60 mt-2">{toLocalTime(msg.created_at)}</p>
                    </div>
                  </div>
                ))
              )}

              {sending ? (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-100 text-slate-500 rounded-2xl rounded-bl-md px-4 py-2 text-sm inline-flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2EC4B6]" />
                    Trace is typing...
                  </div>
                </div>
              ) : null}

              <div ref={bottomRef} />
            </div>

            <div className="px-5 py-4 border-t border-slate-100 bg-white">
              {pendingAttachments.length > 0 ? (
                <div className="mb-3 flex flex-wrap gap-2">
                  {pendingAttachments.map((att, index) => (
                    <button
                      key={`${att.file_name}-${index}`}
                      type="button"
                      onClick={() => removePendingAttachment(index)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border border-slate-200 bg-slate-50 text-slate-600"
                    >
                      <Paperclip className="w-3 h-3" />
                      {clip(att.file_name, 28)} ×
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="flex items-end gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.txt,.md,.csv,.json,.pdf"
                  className="hidden"
                  onChange={(e) => void onAddFiles(e.target.files)}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors grid place-items-center"
                  title="Upload files or photos"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void sendMessage();
                    }
                  }}
                  placeholder="Ask Trace anything about your health patterns..."
                  className="flex-1 min-h-[44px] max-h-[140px] px-4 py-2.5 rounded-2xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#2EC4B6]/20 resize-y"
                />
                <button
                  type="button"
                  onClick={() => void sendMessage()}
                  disabled={sending || (!input.trim() && pendingAttachments.length === 0)}
                  className="w-10 h-10 rounded-full bg-[#0F3D3E] text-white disabled:opacity-50 grid place-items-center"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </section>

          <section className="mt-6 bg-white/80 backdrop-blur-2xl rounded-[28px] border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm uppercase tracking-[0.12em] text-slate-500 font-bold">Recent chats</h2>
              <button
                type="button"
                onClick={startNewChat}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 bg-white text-slate-600 hover:border-[#2EC4B6]/40 hover:bg-[#EAF7F6]/40 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                New chat
              </button>
            </div>
            {loadingChats ? (
              <p className="text-sm text-slate-500">Loading recent chats...</p>
            ) : chats.length === 0 ? (
              <p className="text-sm text-slate-500">No recent chats yet.</p>
            ) : (
              <div className="space-y-2">
                {chats.map((chat) => (
                  <button
                    key={chat.id}
                    type="button"
                    onClick={() => setActiveChatId(chat.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                      activeChatId === chat.id
                        ? "border-[#2EC4B6]/50 bg-[#EAF7F6]/60"
                        : "border-slate-100 hover:border-[#2EC4B6]/30 hover:bg-[#EAF7F6]/30"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-800">{chat.title}</p>
                      <span className="text-xs text-slate-500">{toLocalTime(chat.updated_at)}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {chat.last_message ? clip(chat.last_message, 110) : "No messages"}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </section>
        </motion.div>
      </main>
    </div>
  );
}
