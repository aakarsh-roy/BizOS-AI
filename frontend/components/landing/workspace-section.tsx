"use client";

import { FileText, Globe } from "lucide-react";
import { DemoChat } from "./demo-chat";

const SOURCES = [
  { name: "shipping-policy.pdf", type: "PDF", icon: FileText },
  { name: "returns.docx", type: "DOCX", icon: FileText },
  { name: "acmestore.com", type: "Website", icon: Globe },
];

/**
 * Interactive AI workspace: a contained charcoal panel pairing a static,
 * illustrative source rail with the fully functional DemoChat (streaming,
 * citations, scripted fallback, and live/scripted badge all preserved).
 */
export function WorkspaceSection() {
  return (
    <div className="rounded-xl border border-white/10 bg-[#151922] overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.25)]">
      <div className="flex items-center gap-2.5 px-5 sm:px-6 py-3.5 border-b border-white/10">
        <span className="w-2 h-2 rounded-full bg-emerald-400" aria-hidden="true" />
        <p className="text-[13.5px] font-medium text-white">Acme Store — interactive workspace</p>
        <span className="ml-auto font-mono text-[11px] uppercase tracking-[0.14em] text-white/40">
          Demo content
        </span>
      </div>

      <div className="flex flex-col lg:flex-row">
        <aside className="lg:w-60 shrink-0 border-b lg:border-b-0 lg:border-r border-white/10 p-4 sm:p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/40 mb-3 px-1">
            Connected sources
          </p>
          <ul className="flex lg:flex-col gap-2 overflow-x-auto pb-1 lg:pb-0">
            {SOURCES.map((s) => (
              <li
                key={s.name}
                className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 min-w-[190px] lg:min-w-0"
              >
                <s.icon className="w-4 h-4 text-white/50 shrink-0" />
                <span className="text-[13px] text-white/85 truncate">{s.name}</span>
                <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-white/40 shrink-0">
                  {s.type}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-[11.5px] text-white/35 mt-3 px-1 leading-relaxed">
            Sample sources for illustration.
          </p>
        </aside>

        <div className="flex-1 min-w-0 p-3 sm:p-4 md:p-5">
          <DemoChat />
        </div>
      </div>
    </div>
  );
}
