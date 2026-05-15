import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Sparkles, RotateCcw, ChevronDown, Loader2 } from "lucide-react";
import traceImg from "../../imports/Trace.jpeg";

interface Message {
  id: number;
  role: "trace" | "user";
  text: string;
  time: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: 1,
    role: "trace",
    text: "Hi, I am Trace. I analyse your profile and medical record patterns to give prevention-focused advice in Indian lifestyle context. I do not prescribe medicines.",
    time: "Just now",
  },
];

const SUGGESTIONS = [
  "I am having fever from last 2 days. How can I prevent it getting worse?",
  "What recurring health patterns do you see in my records?",
  "Give me a prevention routine based on my history.",
  "Suggest an Indian homemade kada for my current pattern.",
];

export function TraceBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [unread, setUnread] = useState(0);
  const [pulsed, setPulsed] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const msgId = useRef(100);

  useEffect(() => {
    const t = setTimeout(() => setPulsed(true), 3000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (!isOpen) return;
    setUnread(0);
    setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  async function sendMessage(text: string) {
    const messageText = text.trim();
    if (!messageText || isTyping) return;

    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMessage: Message = { id: msgId.current++, role: "user", text: messageText, time: now };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setIsTyping(true);

    try {
      const history = nextMessages.slice(-10).map((msg) => ({
        role: msg.role,
        text: msg.text,
      }));

      const response = await fetch("/api/trace/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText,
          history,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Trace is unavailable right now.");
      }

      const replyText =
        typeof data?.reply === "string" && data.reply.trim().length > 0
          ? data.reply.trim()
          : "I could not generate a proper response right now. Please try again.";

      setMessages((prev) => [
        ...prev,
        {
          id: msgId.current++,
          role: "trace",
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      if (!isOpen) setUnread((u) => u + 1);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: msgId.current++,
          role: "trace",
          text:
            error?.message ||
            "I am unable to respond right now. Please retry in a moment.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  function reset() {
    setMessages(INITIAL_MESSAGES);
    setInput("");
    setIsTyping(false);
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-2">
        <AnimatePresence>
          {!isOpen && pulsed && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.9 }}
              className="bg-white rounded-2xl shadow-lg border border-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 max-w-[230px] text-center"
            >
              Ask Trace for prevention tips
              <div className="absolute bottom-[-6px] right-8 w-3 h-3 bg-white border-r border-b border-slate-100 rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => {
            setIsOpen((o) => !o);
            setPulsed(false);
          }}
          whileHover={{ scale: 1.07 }}
          whileTap={{ scale: 0.95 }}
          className="relative w-[68px] h-[68px] rounded-full overflow-hidden shadow-[0_8px_32px_rgba(15,61,62,0.25)] border-[3px] border-white focus:outline-none"
          style={{ background: "linear-gradient(135deg, #2EC4B6 0%, #0F3D3E 100%)" }}
        >
          <img src={traceImg.src} alt="Trace AI" className="w-full h-full object-cover scale-110" />
          <AnimatePresence>
            {unread > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute top-0 right-0 w-5 h-5 bg-rose-500 rounded-full border-2 border-white text-white text-[10px] font-bold flex items-center justify-center"
              >
                {unread}
              </motion.span>
            )}
          </AnimatePresence>
          <span className="absolute bottom-1 right-1 w-3 h-3 bg-[#2EC4B6] rounded-full border-2 border-white" />
        </motion.button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20, originX: 1, originY: 1 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", damping: 28, stiffness: 340 }}
            className="fixed bottom-[90px] right-6 z-[99] w-[390px] max-w-[calc(100vw-1.5rem)] bg-white rounded-[28px] shadow-[0_24px_64px_rgba(15,61,62,0.22)] border border-slate-100 flex flex-col overflow-hidden"
            style={{ maxHeight: "min(640px, calc(100vh - 120px))" }}
          >
            <div
              className="relative flex items-center gap-3 px-5 py-4 shrink-0 overflow-hidden"
              style={{ background: "linear-gradient(135deg, #0F3D3E 0%, #1A595A 100%)" }}
            >
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-[#2EC4B6]/20 rounded-full blur-2xl pointer-events-none" />

              <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-[#2EC4B6]/60 shadow-md shrink-0">
                <img src={traceImg.src} alt="Trace" className="w-full h-full object-cover scale-110" />
              </div>

              <div className="flex-1 min-w-0 relative z-10">
                <div className="flex items-center gap-2">
                  <span className="text-white font-extrabold tracking-tight">Trace</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#2EC4B6]/20 border border-[#2EC4B6]/30 text-[#2EC4B6] text-[10px] font-bold uppercase tracking-wider">
                    <Sparkles className="w-2.5 h-2.5" /> AI
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-white/60 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2EC4B6] animate-pulse" />
                  Prevention-focused assistant
                </div>
              </div>

              <div className="flex items-center gap-1 relative z-10">
                <button
                  onClick={reset}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all"
                  title="Reset chat"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50/50" style={{ scrollbarWidth: "none" }}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  {msg.role === "trace" && (
                    <div className="w-7 h-7 rounded-full overflow-hidden border border-[#2EC4B6]/30 shrink-0 mt-0.5">
                      <img src={traceImg.src} alt="Trace" className="w-full h-full object-cover scale-110" />
                    </div>
                  )}
                  <div className={`max-w-[82%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                    <div
                      className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                        msg.role === "user"
                          ? "bg-[#0F3D3E] text-white rounded-br-md"
                          : "bg-white border border-slate-100 text-slate-700 rounded-bl-md shadow-sm"
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-slate-400 px-1">{msg.time}</span>
                  </div>
                </motion.div>
              ))}

              <AnimatePresence>
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="flex gap-2.5 items-end"
                  >
                    <div className="w-7 h-7 rounded-full overflow-hidden border border-[#2EC4B6]/30 shrink-0">
                      <img src={traceImg.src} alt="Trace" className="w-full h-full object-cover scale-110" />
                    </div>
                    <div className="bg-white border border-slate-100 shadow-sm rounded-2xl rounded-bl-md px-4 py-3.5 flex items-center gap-2 text-slate-500 text-xs font-semibold">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2EC4B6]" />
                      Trace is analysing your records...
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={bottomRef} />
            </div>

            {messages.length <= 2 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5 bg-slate-50/50">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => sendMessage(suggestion)}
                    className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:border-[#2EC4B6]/50 hover:text-[#0F3D3E] hover:bg-[#EAF7F6] transition-all shadow-sm"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            <div className="px-4 py-3 bg-white border-t border-slate-100 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void sendMessage(input);
                }}
                className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 focus-within:border-[#2EC4B6]/50 focus-within:ring-2 focus-within:ring-[#2EC4B6]/10 transition-all"
              >
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Trace about prevention..."
                  className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none font-medium"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-30 shrink-0"
                  style={{ background: input.trim() ? "linear-gradient(135deg, #2EC4B6, #0F3D3E)" : undefined }}
                >
                  <Send className={`w-3.5 h-3.5 ${input.trim() ? "text-white" : "text-slate-400"}`} />
                </button>
              </form>
              <p className="text-center text-[10px] text-slate-400 mt-2 font-medium">
                Prevention guidance only · For emergencies contact doctor/hospital
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
