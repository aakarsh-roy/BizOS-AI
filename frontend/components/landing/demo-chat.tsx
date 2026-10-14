"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, Loader2 } from "lucide-react";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

interface DemoMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "What can this chatbot do?",
  "How do I install it on my website?",
  "Can it capture leads?",
];

const DEMO_BOT_NAME = "BizOS Assistant";

function scriptedReply(input: string): string {
  const text = input.toLowerCase();
  if (/(price|pricing|cost|plan)/.test(text)) {
    return "BizOS AI is free while in beta — one chatbot, knowledge base, embed widget, leads, and tickets included. Paid plans aren't finalized yet, and beta users carry founding terms into them.";
  }
  if (/(install|embed|website|wordpress|snippet|add)/.test(text)) {
    return "Installing takes about a minute: copy the snippet from your Install page and paste it before the closing </body> tag on your site. It works with WordPress, Webflow, Shopify, or plain HTML — no coding required.";
  }
  if (/(lead|leads|sales|capture)/.test(text)) {
    return "Yes! When lead capture is enabled, I can collect a visitor's name, email, and notes during the conversation and save them straight to your Leads pipeline — you review everything from the dashboard.";
  }
  if (/(ticket|support|help|issue)/.test(text)) {
    return "I can create support tickets too. Just describe the issue and I'll file a ticket with a reference you can track — your team manages it from the Support Tickets page.";
  }
  if (/(document|upload|knowledge|pdf|train)/.test(text)) {
    return "Upload PDFs, DOCX, or TXT files — or import your whole website with one crawl. I answer from your content and cite my sources, and I'll say so honestly when something isn't covered.";
  }
  if (/(hi|hello|hey|yo)\b/.test(text)) {
    return `Hi there! I'm ${DEMO_BOT_NAME}. Ask me what this chatbot can do, how to install it, or whether it captures leads.`;
  }
  if (/(thank|thanks|great|awesome|cool)/.test(text)) {
    return "You're welcome! Want to build one for your own business? Hit “Start free” above — signup is free and the Install page walks you through setup.";
  }
  return "Great question! In this interactive preview I answer from a small script — but the real BizOS chatbot answers from *your* documents and website. Try one of the suggestions, or start free to train it on your own content.";
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function DemoChat() {
  const demoChatbotId = process.env.NEXT_PUBLIC_DEMO_CHATBOT_ID || "";
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
  const [messages, setMessages] = useState<DemoMessage[]>([
    {
      id: 0,
      role: "assistant",
      content: `Hi! I'm ${DEMO_BOT_NAME} — a live preview of what your own chatbot could feel like. Ask me something below.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [liveMode, setLiveMode] = useState(false);
  const idRef = useRef(1);
  const listRef = useRef<HTMLDivElement>(null);
  // Becomes true once the visitor sends their first message. The chat must
  // never steal the page scroll on initial load — only follow new messages
  // during an active conversation.
  const userChattedRef = useRef(false);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (!userChattedRef.current) return;
    // Scroll the messages panel only — scrolling via the sentinel would
    // bubble up and move the whole page, so it must not be used here.
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: reduced ? "auto" : "smooth",
    });
  }, [messages, thinking, reduced]);

  const pushMessage = (role: "user" | "assistant", content: string) => {
    const id = idRef.current++;
    setMessages((prev) => [...prev, { id, role, content }]);
    return id;
  };

  const streamFromBackend = async (text: string): Promise<boolean> => {
    if (!demoChatbotId) return false;
    try {
      const res = await fetch(`${apiBase}/chat/widget/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatbot_id: demoChatbotId, message: text }),
      });
      if (!res.ok || !res.body) return false;
      setLiveMode(true);
      const id = pushMessage("assistant", "");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === "content") {
              full += data.data;
              const snapshot = full;
              setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, content: snapshot } : m)));
            } else if (data.type === "error") {
              full += `\n\n${data.data}`;
              const snapshot = full;
              setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, content: snapshot } : m)));
            }
          } catch {
            // skip malformed chunks
          }
        }
      }
      return true;
    } catch {
      return false;
    }
  };

  const handleSend = async (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || thinking) return;
    userChattedRef.current = true;
    setInput("");
    setThinking(true);
    pushMessage("user", text);
    try {
      const streamed = await streamFromBackend(text);
      if (!streamed) {
        await sleep(700 + Math.min(text.length * 10, 900));
        pushMessage("assistant", scriptedReply(text));
      }
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className="w-full rounded-[14px] border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 py-3.5 bg-surface border-b border-border">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-[8px] bg-primary flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <p className="font-display font-semibold text-white text-[15px] truncate">{DEMO_BOT_NAME}</p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md border shrink-0 ${
            liveMode
              ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
              : "text-amber-400 border-amber-500/30 bg-amber-500/10"
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${liveMode ? "bg-emerald-400" : "bg-amber-400"}`} />
          {liveMode ? "Live backend" : "Scripted preview"}
        </span>
      </div>

      <div ref={listRef} className="h-[340px] overflow-y-auto p-5 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`max-w-[85%] px-4 py-2.5 rounded-xl text-sm leading-relaxed ${
                m.role === "user"
                  ? "ml-auto bg-primary text-white rounded-br-md"
                  : "bg-surface border border-border text-foreground rounded-bl-md"
              }`}
            >
              {m.content}
            </motion.div>
          ))}
        </AnimatePresence>
        {thinking && (
          <div className="flex gap-1.5 px-4 py-3 bg-surface border border-border rounded-xl rounded-bl-md w-fit">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border bg-card">
        <div className="flex flex-wrap gap-2 mb-3">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleSend(s)}
              disabled={thinking}
              className="text-xs px-3 py-1.5 rounded-md border border-border text-muted hover:text-white hover:border-primary/60 hover:bg-primary/10 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {s}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask something..."
            aria-label="Ask the demo chatbot"
            className="flex-1 px-4 py-2.5 rounded-md bg-background border border-border text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={!input.trim() || thinking}
            aria-label="Send message"
            className="w-10 h-10 rounded-md bg-primary text-white flex items-center justify-center hover:bg-[#5B8CFF] transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {thinking ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
