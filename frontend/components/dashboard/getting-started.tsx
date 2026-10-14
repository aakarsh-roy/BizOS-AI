"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Settings2,
  FileSearch,
  MessageSquare,
  Rocket,
  Check,
  X,
  ArrowRight,
} from "lucide-react";
import type { AnalyticsOverview, ChatbotConfig } from "@/types";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "bizos_checklist_dismissed";
export const INSTALL_SEEN_KEY = "bizos_install_seen";

export function isChecklistDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

interface GettingStartedProps {
  stats: AnalyticsOverview | null;
  chatbot: ChatbotConfig | null;
}

export function GettingStarted({ stats, chatbot }: GettingStartedProps) {
  const [dismissed, setDismissed] = useState(isChecklistDismissed);

  let installSeen = false;
  try {
    installSeen = localStorage.getItem(INSTALL_SEEN_KEY) === "1";
  } catch {
    installSeen = false;
  }

  if (dismissed) return null;

  const steps = [
    {
      icon: Settings2,
      title: "Configure your chatbot",
      desc: "Add business instructions so answers sound like you.",
      href: "/chatbot",
      done: Boolean(chatbot?.system_instructions?.trim()),
    },
    {
      icon: FileSearch,
      title: "Add knowledge",
      desc: "Upload documents or import your website.",
      href: "/knowledge",
      done: (stats?.total_documents ?? 0) > 0,
    },
    {
      icon: MessageSquare,
      title: "Test a conversation",
      desc: "Chat with your bot and check its answers.",
      href: "/chat",
      done: (stats?.total_chats ?? 0) > 0,
    },
    {
      icon: Rocket,
      title: "Install on your website",
      desc: "Copy the snippet onto your site.",
      href: "/integration",
      done: installSeen,
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  if (doneCount === steps.length) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // storage unavailable
    }
    setDismissed(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-2xl border border-border bg-card p-6 md:p-8 mb-12 relative overflow-hidden"
    >
      <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br from-blue-500/15 to-purple-600/15 blur-[60px] pointer-events-none" />
      <div className="flex items-start justify-between gap-4 mb-2">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Getting started</h2>
          <p className="text-sm text-muted mt-1">
            {doneCount} of {steps.length} complete — your chatbot goes live at step 4.
          </p>
        </div>
        <button
          onClick={dismiss}
          className="p-1.5 rounded-lg text-muted hover:text-white hover:bg-white/5 transition-colors"
          aria-label="Dismiss getting started"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="h-1.5 rounded-full bg-white/5 mt-4 mb-6 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-primary"
          initial={false}
          animate={{ width: `${(doneCount / steps.length) * 100}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {steps.map((s) => (
          <Link
            key={s.title}
            href={s.href}
            className={cn(
              "group rounded-xl border p-4 transition-all",
              s.done
                ? "border-emerald-500/20 bg-emerald-500/5"
                : "border-border bg-background/60 hover:border-primary/40 hover:bg-primary/5"
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center border",
                  s.done
                    ? "bg-emerald-500/15 border-emerald-500/25"
                    : "bg-white/5 border-border"
                )}
              >
                {s.done ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <s.icon className="w-4 h-4 text-primary" />
                )}
              </div>
              <ArrowRight className="w-4 h-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-sm font-semibold text-white">{s.title}</p>
            <p className="text-xs text-muted mt-1 leading-relaxed">{s.desc}</p>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}
