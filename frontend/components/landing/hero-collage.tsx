"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FileText, Globe, Settings2 } from "lucide-react";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

interface CollageEntry {
  id: string;
  question: string;
  sourceIcon: typeof FileText;
  sourceFile: string;
  sourceKind: string;
  sourceExcerpt: string;
  answer: string;
  citation: string;
  outcome?: string;
}

const ENTRIES: CollageEntry[] = [
  {
    id: "shipping",
    question: "Do you offer free shipping in India?",
    sourceIcon: FileText,
    sourceFile: "shipping-policy.pdf",
    sourceKind: "PDF",
    sourceExcerpt: "Standard shipping is free on eligible Indian orders…",
    answer:
      "Yes, standard shipping is free on eligible Indian orders. Express shipping is available at checkout for an additional fee.",
    citation: "Shipping Policy · Section 2",
  },
  {
    id: "refunds",
    question: "What's your refund window?",
    sourceIcon: FileText,
    sourceFile: "returns.docx",
    sourceKind: "DOCX",
    sourceExcerpt: "Full refunds within 30 days of purchase…",
    answer: "Full refunds within 30 days of purchase — no questions asked.",
    citation: "Returns Policy · Section 1",
  },
  {
    id: "tracking",
    question: "Keep me posted on my order",
    sourceIcon: Settings2,
    sourceFile: "Lead capture",
    sourceKind: "Enabled action",
    sourceExcerpt: "Collect name, email, and notes mid-conversation…",
    answer: "Done — I'll email tracking updates to ana@example.com.",
    citation: "Conversation · Just now",
    outcome: "Lead captured successfully",
  },
];

/**
 * Bold-Split hero collage: overlapping source fragments, a compact dark chat
 * card, and selectable fixed questions that highlight the linked source.
 * Guided illustration only — free-form chat lives in the demo workspace below.
 */
export function HeroCollage() {
  const [selectedId, setSelectedId] = useState(ENTRIES[0].id);
  const reduced = usePrefersReducedMotion();
  const active = ENTRIES.find((e) => e.id === selectedId) ?? ENTRIES[0];

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6" role="group" aria-label="Sample questions">
        {ENTRIES.map((e) => (
          <button
            key={e.id}
            onClick={() => setSelectedId(e.id)}
            aria-pressed={selectedId === e.id}
            className={cn(
              "text-[13px] px-3.5 py-2 rounded-lg border transition-colors",
              selectedId === e.id
                ? "border-[#2F6BFF] bg-[#2F6BFF]/[.07] text-[#17191F] font-medium"
                : "border-[#E5E3DD] bg-white text-[#656A73] hover:text-[#17191F] hover:border-[#C9C4B8]"
            )}
          >
            {e.question}
          </button>
        ))}
      </div>

      <div className="relative grid grid-cols-1 sm:grid-cols-[1fr_1.15fr] gap-5 items-start">
        {/* Source fragments */}
        <div className="relative pt-2 pr-2">
          <div className="absolute -top-1 left-2 rotate-[-2deg] w-3/4 rounded-lg border border-[#E5E3DD] bg-white p-4 shadow-[0_10px_30px_rgba(23,25,31,0.08)]">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[#858B98] mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3 h-3" /> acmestore.com
            </p>
            <p className="text-[12.5px] leading-relaxed text-[#656A73]">
              Express options appear at checkout, with tracking on every order…
            </p>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={reduced ? false : { opacity: 0.4 }}
              animate={{ opacity: 1 }}
              exit={reduced ? { opacity: 1 } : { opacity: 0.4 }}
              transition={{ duration: 0.25 }}
              className={cn(
                "relative ml-8 mt-14 rounded-lg border bg-white p-4 shadow-[0_10px_30px_rgba(23,25,31,0.08)] transition-colors",
                "border-[#2F6BFF]"
              )}
            >
              <p className="font-mono text-[10px] uppercase tracking-wider text-[#858B98] mb-1.5 flex items-center gap-1.5">
                <active.sourceIcon className="w-3 h-3" /> {active.sourceFile}
                <span className="ml-auto text-[#2F6BFF]">{active.sourceKind}</span>
              </p>
              <p className="text-[13px] leading-relaxed text-[#17191F]">“{active.sourceExcerpt}”</p>
            </motion.div>
          </AnimatePresence>
          <p className="font-serif-display italic text-[15px] text-[#858B98] mt-5 ml-1">
            sources your business already has
          </p>
        </div>

        {/* Compact dark chat */}
        <div className="rounded-xl border border-white/10 bg-[#151922] overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.22)]">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
            <p className="text-[12.5px] font-medium text-white">Acme Assistant</p>
            <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.12em] text-white/35">
              Illustrative
            </span>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={reduced ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="p-4 space-y-3 text-[13.5px] leading-relaxed min-h-[228px]"
            >
              <div className="max-w-[88%] ml-auto px-3.5 py-2.5 rounded-xl rounded-br-md bg-[#2F6BFF] text-white">
                {active.question}
                {active.id === "tracking" ? " — ana@example.com" : ""}
              </div>
              <div className="max-w-[94%] px-3.5 py-2.5 rounded-xl rounded-bl-md bg-white/[0.06] border border-white/10 text-white">
                {active.answer}
                <span className="flex items-center gap-1 mt-2 text-[11px] px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-white/60 w-fit">
                  <FileText className="w-3 h-3" />
                  {active.citation}
                </span>
              </div>
              {active.outcome && (
                <p className="text-[12.5px] font-medium text-emerald-400">✓ {active.outcome}</p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
