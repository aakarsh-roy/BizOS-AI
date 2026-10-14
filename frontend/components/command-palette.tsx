"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  Bot,
  MessageSquare,
  FileText,
  Users,
  Ticket,
  BarChart3,
  Settings,
  Search,
  Plus,
  Upload,
  UserPlus,
  TicketPlus,
  CornerDownLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PaletteEntry {
  icon: typeof LayoutDashboard;
  label: string;
  hint?: string;
  keywords: string;
  run: (router: ReturnType<typeof useRouter>) => void;
}

const PAGES: PaletteEntry[] = [
  { icon: LayoutDashboard, label: "Go to Overview", keywords: "dashboard home overview", run: (r) => r.push("/dashboard") },
  { icon: Bot, label: "Go to My Chatbot", keywords: "chatbot configure settings bot", run: (r) => r.push("/chatbot") },
  { icon: MessageSquare, label: "Go to Conversations", keywords: "chat conversations test messages", run: (r) => r.push("/chat") },
  { icon: FileText, label: "Go to Knowledge Base", keywords: "documents knowledge upload crawl files", run: (r) => r.push("/knowledge") },
  { icon: Users, label: "Go to Leads", keywords: "leads sales contacts", run: (r) => r.push("/leads") },
  { icon: Ticket, label: "Go to Support Tickets", keywords: "tickets support issues", run: (r) => r.push("/tickets") },
  { icon: BarChart3, label: "Go to Analytics", keywords: "analytics stats charts usage", run: (r) => r.push("/analytics") },
  { icon: Settings, label: "Go to Install", keywords: "install embed snippet widget website", run: (r) => r.push("/integration") },
];

const ACTIONS: PaletteEntry[] = [
  { icon: Plus, label: "Start new chat", hint: "Conversations", keywords: "new chat test conversation", run: (r) => r.push("/chat") },
  { icon: Upload, label: "Upload a document", hint: "Knowledge Base", keywords: "upload document file pdf", run: (r) => r.push("/knowledge") },
  { icon: UserPlus, label: "Add a lead", hint: "Leads", keywords: "add lead create contact", run: (r) => r.push("/leads") },
  { icon: TicketPlus, label: "Create a ticket", hint: "Tickets", keywords: "create ticket new issue", run: (r) => r.push("/tickets") },
];

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && <PalettePanel onClose={onClose} />}
    </AnimatePresence>
  );
}

function PalettePanel({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(t);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (e: PaletteEntry) =>
      !q || e.label.toLowerCase().includes(q) || e.keywords.includes(q);
    return [
      { group: "Pages", entries: PAGES.filter(match) },
      { group: "Actions", entries: ACTIONS.filter(match) },
    ].filter((g) => g.entries.length > 0);
  }, [query]);

  const flat = useMemo(() => results.flatMap((g) => g.entries), [results]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setIndex((i) => Math.min(i + 1, flat.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        const entry = flat[index];
        if (entry) {
          onClose();
          entry.run(router);
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [flat, index, onClose, router]);

  useEffect(() => {
    listRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [index]);

  let cursor = -1;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-hidden="true"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.15 }}
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            className="relative w-full max-w-lg rounded-2xl border border-border bg-card premium-shadow overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 border-b border-border">
              <Search className="w-4 h-4 text-muted shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setIndex(0);
                }}
                placeholder="Search pages and actions..."
                aria-label="Search pages and actions"
                className="flex-1 py-4 bg-transparent text-sm text-foreground placeholder:text-muted/60 focus:outline-none"
              />
              <kbd className="text-[10px] px-1.5 py-0.5 rounded border border-border text-muted">ESC</kbd>
            </div>
            <div ref={listRef} className="max-h-[320px] overflow-y-auto p-2">
              {flat.length === 0 && (
                <p className="text-sm text-muted text-center py-8">No matches. Try another search.</p>
              )}
              {results.map((group) => (
                <div key={group.group} className="mb-1">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted/70 px-3 pt-2 pb-1">
                    {group.group}
                  </p>
                  {group.entries.map((entry) => {
                    cursor += 1;
                    const active = cursor === index;
                    return (
                      <button
                        key={entry.label}
                        data-active={active}
                        onClick={() => {
                          onClose();
                          entry.run(router);
                        }}
                        onMouseMove={() => setIndex(cursor)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors text-left",
                          active ? "bg-primary/15 text-white" : "text-muted hover:text-white hover:bg-white/5"
                        )}
                      >
                        <entry.icon className={cn("w-4 h-4 shrink-0", active ? "text-primary" : "text-muted/70")} />
                        <span className="flex-1">{entry.label}</span>
                        {entry.hint && (
                          <span className="text-[11px] text-muted/60">{entry.hint}</span>
                        )}
                        {active && <CornerDownLeft className="w-3.5 h-3.5 text-muted/60" />}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
  );
}

export function useCommandPaletteShortcut(onOpen: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpen();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onOpen]);
}
