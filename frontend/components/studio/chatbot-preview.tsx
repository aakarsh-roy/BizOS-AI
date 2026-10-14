"use client";

import { motion } from "framer-motion";
import { Bot, Send, UserPlus, TicketPlus } from "lucide-react";

interface ChatbotPreviewProps {
  name: string;
  welcome: string;
  color: string;
  tone: string;
  leadCapture: boolean;
  ticketCreation: boolean;
}

const TONE_SAMPLES: Record<string, string> = {
  friendly: "Absolutely! I'd love to help with that — here's what I found for you 😊",
  professional: "Certainly. Based on your documentation, here is the relevant information.",
  concise: "Yes. Details below.",
};

export function ChatbotPreview({
  name,
  welcome,
  color,
  tone,
  leadCapture,
  ticketCreation,
}: ChatbotPreviewProps) {
  const displayName = name.trim() || "AI Assistant";
  const displayWelcome = welcome.trim() || "Hi! I'm here to help. How can I assist you today?";
  const sampleReply = TONE_SAMPLES[tone] || TONE_SAMPLES.friendly;

  return (
    <div className="rounded-2xl border border-border bg-card premium-shadow overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
        <p className="text-xs font-medium text-muted uppercase tracking-wider">Live preview</p>
        <span className="flex items-center gap-1.5 text-[11px] text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Updates as you type
        </span>
      </div>

      {/* Phone mockup */}
      <div className="p-4 bg-background/60">
        <div className="rounded-2xl overflow-hidden border border-border bg-card">
          <div
            className="px-4 py-3.5 flex items-center gap-2.5 transition-colors"
            style={{ background: `linear-gradient(135deg, #1e3a8a, ${color})` }}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            <span className="font-semibold text-white text-sm truncate">{displayName}</span>
          </div>

          <div className="p-4 space-y-3 min-h-[220px]">
            <motion.div
              key={displayWelcome}
              initial={{ opacity: 0.4 }}
              animate={{ opacity: 1 }}
              className="max-w-[90%] px-3.5 py-2.5 rounded-2xl rounded-bl-md bg-surface border border-border text-[13px] leading-relaxed"
            >
              {displayWelcome}
            </motion.div>
            <div className="max-w-[80%] ml-auto px-3.5 py-2.5 rounded-2xl rounded-br-md text-[13px] text-white transition-colors"
              style={{ background: `linear-gradient(135deg, ${color}, ${color}dd)` }}
            >
              Do you offer a free plan?
            </div>
            <motion.div
              key={sampleReply}
              initial={{ opacity: 0.4 }}
              animate={{ opacity: 1 }}
              className="max-w-[90%] px-3.5 py-2.5 rounded-2xl rounded-bl-md bg-surface border border-border text-[13px] leading-relaxed"
            >
              {sampleReply}
            </motion.div>
            {(leadCapture || ticketCreation) && (
              <div className="flex flex-wrap gap-1.5">
                {leadCapture && (
                  <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <UserPlus className="w-3 h-3" /> Lead capture on
                  </span>
                )}
                {ticketCreation && (
                  <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    <TicketPlus className="w-3 h-3" /> Tickets on
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="p-3 border-t border-border flex gap-2">
            <div className="flex-1 px-3.5 py-2.5 rounded-full bg-background border border-border text-[13px] text-muted/50">
              Type a message...
            </div>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
              style={{ backgroundColor: color }}
            >
              <Send className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3 text-xs text-muted">
          <Bot className="w-3.5 h-3.5" />
          This is how visitors will see your chatbot.
        </div>
      </div>
    </div>
  );
}
