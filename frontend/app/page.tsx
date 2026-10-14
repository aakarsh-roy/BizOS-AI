"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  ChevronDown,
  FileText,
  Globe,
  UserPlus,
  TicketPlus,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { useEscapeKey } from "@/hooks/use-escape-key";
import { SiteHeader } from "@/components/landing/site-header";
import { SiteFooter } from "@/components/landing/site-footer";
import { WorkspaceSection } from "@/components/landing/workspace-section";
import { WidgetEmbed } from "@/components/landing/widget-embed";
import { HeroCollage } from "@/components/landing/hero-collage";

const FAQS = [
  {
    q: "How much does BizOS AI cost?",
    a: "BizOS AI is free while in beta — one chatbot, knowledge base, embed widget, lead capture, tickets, and analytics included, with no credit card required. Paid plans are not finalized yet, and beta users will carry founding terms into them.",
  },
  {
    q: "How do I put the chatbot on my website?",
    a: "Copy the snippet from your Install page and paste it before the closing </body> tag. It works with WordPress, Webflow, Shopify, Wix, or plain HTML, and configuration updates apply without reinstalling.",
  },
  {
    q: "What can I train it on?",
    a: "PDF, DOCX, and TXT uploads, plus a crawl of your website. Each file shows its processing status, answers cite their sources, and deleted files stop being retrievable.",
  },
  {
    q: "Who can see my business data?",
    a: "Only your workspace. Documents, conversations, leads, tickets, and analytics are scoped to your account, and the public widget can only reach your chatbot through its public ID — never your private data.",
  },
  {
    q: "Is the demo on this page a real AI?",
    a: "It depends on the badge in the demo header. When a demo chatbot is configured it streams live answers from the backend; otherwise it runs a built-in scripted preview. The badge always tells you which mode you're in.",
  },
];

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  useEscapeKey(open !== null, () => setOpen(null));

  return (
    <div className="max-w-3xl">
      {FAQS.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={f.q} className="border-b border-[#E5E3DD]">
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              aria-controls={`faq-panel-${i}`}
              className="w-full flex items-center justify-between gap-4 py-5 text-left"
            >
              <span className="font-medium text-[16px] text-[#17191F]">{f.q}</span>
              <ChevronDown
                className={`w-5 h-5 shrink-0 text-[#858B98] transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </button>
            {isOpen && (
              <p id={`faq-panel-${i}`} className="pb-6 text-[15px] leading-relaxed text-[#656A73] max-w-2xl">
                {f.a}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

const SETUP_STEPS = [
  { n: "01", t: "Create account", d: "Register free and set up your business workspace." },
  { n: "02", t: "Connect knowledge", d: "Upload PDFs, docs, text — or crawl your website." },
  { n: "03", t: "Configure", d: "Name, tone, branding, instructions, and enabled actions." },
  { n: "04", t: "Test", d: "Interrogate it in Conversations — replies, tool calls, citations." },
  { n: "05", t: "Install", d: "Copy the snippet onto your site. Updates apply on their own." },
];

export default function LandingPage() {
  const { isAuthenticated, company } = useAuth();
  const reduced = usePrefersReducedMotion();
  const primaryHref = isAuthenticated ? (company ? "/dashboard" : "/onboarding") : "/register";
  const primaryLabel = isAuthenticated ? "Open dashboard" : "Get started";
  const fade = (delay: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: "-60px" },
          transition: { duration: 0.5, delay },
        };

  return (
    <div className="landing min-h-screen bg-[#FAF9F5] text-[#17191F] overflow-x-clip">
      <SiteHeader />

      {/* ── Hero · Bold Split ──────────────────────────────────────── */}
      <section className="border-b border-[#E5E3DD]">
        <div className="max-w-6xl mx-auto px-4 md:px-6 pt-14 pb-16 md:pt-20 md:pb-24 grid grid-cols-1 lg:grid-cols-[0.92fr_1.08fr] gap-12 lg:gap-8 items-center">
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="l-eyebrow">Business knowledge, ready for conversation</p>
            <h1 className="font-serif-display font-semibold tracking-tight text-[46px] leading-[1.02] sm:text-6xl lg:text-[68px] mb-6">
              Your business knows the answer.
            </h1>
            <p className="text-[#656A73] text-[17px] leading-relaxed max-w-lg mb-8">
              Connect your documents and website. Give visitors accurate answers,
              capture leads, and create support tickets — all through one
              configurable chatbot.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Link
                href={primaryHref}
                className="l-btn-primary inline-flex items-center justify-center gap-2 px-6 py-3 text-[15px] font-semibold"
              >
                {primaryLabel}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#demo"
                className="l-btn-secondary inline-flex items-center justify-center gap-2 px-6 py-3 text-[15px] font-medium"
              >
                Try the assistant
              </a>
            </div>
            <p className="font-mono text-[12.5px] text-[#858B98]">
              Free while in beta · No credit card
            </p>
          </motion.div>

          <motion.div
            initial={reduced ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12 }}
            className="lg:pt-4"
          >
            <HeroCollage />
          </motion.div>
        </div>
      </section>

      {/* ── Interactive workspace ──────────────────────────────────── */}
      <section id="demo" className="border-b border-[#E5E3DD] scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-14 md:py-20">
          <motion.div {...fade(0)}>
            <WorkspaceSection />
          </motion.div>
          <p className="text-[12.5px] text-[#858B98] mt-4 max-w-2xl leading-relaxed">
            Sources shown are illustrative samples. The conversation streams live
            when a demo chatbot is configured, otherwise it runs a scripted
            preview — the badge inside the chat always tells you which.
          </p>
        </div>
      </section>

      {/* ── Scene 01 · Knowledge collage ────────────────────────────── */}
      <section id="product" className="border-b border-[#E5E3DD] bg-white scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-24">
          <p className="l-eyebrow">01 — Knowledge</p>
          <div className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-12 items-start">
            <div>
              <h2 className="font-serif-display font-semibold tracking-tight text-3xl md:text-[40px] leading-[1.08] mb-5">
                Your answers already exist somewhere.
              </h2>
              <p className="text-[#656A73] text-[16px] leading-relaxed max-w-md">
                Policies, returns, product pages — useful information is scattered
                across content you already have. Connect PDF, DOCX, TXT, and your
                website, and watch each file process.
              </p>
              <p className="font-serif-display italic text-[17px] text-[#858B98] mt-8">
                nothing to write from scratch —
              </p>
            </div>
            <motion.div {...fade(0.1)} className="relative pb-10 pl-2">
              <div className="absolute top-6 bottom-0 left-[7px] w-px bg-[#E5E3DD]" aria-hidden="true" />
              <div className="space-y-5">
                <figure className="relative ml-8 rounded-lg border border-[#E5E3DD] bg-[#FAF9F5] p-5 max-w-md">
                  <span className="absolute -left-8 top-6 w-[15px] h-[15px] rounded-full bg-[#2F6BFF] ring-4 ring-[#2F6BFF]/15" aria-hidden="true" />
                  <p className="font-mono text-[10px] uppercase tracking-wider text-[#858B98] mb-2 flex items-center gap-1.5">
                    <FileText className="w-3 h-3" /> shipping-policy.pdf
                  </p>
                  <blockquote className="font-serif-display text-[17px] leading-relaxed">
                    “Standard shipping is free on eligible Indian orders…”
                  </blockquote>
                </figure>
                <figure className="relative ml-16 sm:ml-24 rounded-lg border border-[#E5E3DD] bg-[#FAF9F5] p-5 max-w-md">
                  <span className="absolute -left-8 top-6 w-[15px] h-[15px] rounded-full bg-white border-2 border-[#2F6BFF]" aria-hidden="true" />
                  <p className="font-mono text-[10px] uppercase tracking-wider text-[#858B98] mb-2 flex items-center gap-1.5">
                    <FileText className="w-3 h-3" /> returns.docx
                  </p>
                  <blockquote className="font-serif-display text-[17px] leading-relaxed">
                    “Full refunds within 30 days of purchase…”
                  </blockquote>
                </figure>
                <figure className="relative ml-8 rounded-lg border border-[#E5E3DD] bg-white overflow-hidden max-w-md shadow-[0_12px_32px_rgba(23,25,31,0.08)]">
                  <span className="absolute -left-8 top-6 w-[15px] h-[15px] rounded-full bg-white border-2 border-[#2F6BFF] z-10" aria-hidden="true" />
                  <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-[#E5E3DD] bg-[#F1F3F7]">
                    <Globe className="w-3.5 h-3.5 text-[#858B98]" />
                    <span className="font-mono text-[11px] text-[#858B98]">acmestore.com/shipping</span>
                  </div>
                  <p className="p-4 text-[13.5px] leading-relaxed text-[#656A73]">
                    Express options appear at checkout, with tracking on every order…
                  </p>
                </figure>
              </div>
            </motion.div>
          </div>
          <p className="font-mono text-[11.5px] text-[#858B98] mt-4">Illustrative excerpts.</p>
        </div>
      </section>

      {/* ── Scene 02 · Understanding ───────────────────────────────── */}
      <section className="border-b border-[#E5E3DD]">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-24">
          <p className="l-eyebrow">02 — Understanding</p>
          <h2 className="font-serif-display font-semibold tracking-tight text-3xl md:text-[40px] leading-[1.08] mb-4 max-w-2xl">
            Bring that knowledge into the conversation.
          </h2>
          <p className="text-[#656A73] text-[16px] leading-relaxed max-w-2xl mb-12">
            The source visibly informs the answer. Grounded replies carry their
            citation; anything uncovered gets an honest answer instead of an
            invention.
          </p>
          <motion.div {...fade(0.1)} className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1.3fr] gap-5 lg:gap-0 items-stretch max-w-5xl">
            <div className="l-card p-6">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#858B98] mb-3">Source</p>
              <p className="font-serif-display text-[19px] leading-snug mb-3">
                “Standard shipping is free on eligible Indian orders…”
              </p>
              <p className="font-mono text-[11px] text-[#858B98] flex items-center gap-1.5">
                <FileText className="w-3 h-3" /> shipping-policy.pdf
              </p>
            </div>
            <div className="flex lg:flex-col items-center justify-center px-2" aria-hidden="true">
              <span className="lg:hidden w-[2px] h-10 bg-[#2F6BFF]" />
              <span className="hidden lg:flex items-center justify-center w-10 h-10 rounded-full bg-[#2F6BFF] text-white font-mono text-sm shrink-0">→</span>
            </div>
            <div className="rounded-xl bg-[#151922] p-6 lg:p-7">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/40 mb-3">Grounded answer</p>
              <p className="text-[15.5px] leading-relaxed text-white">
                Yes, standard shipping is free on eligible Indian orders. Express
                shipping is available at checkout for an additional fee.
              </p>
              <p className="mt-4 inline-flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-white/60">
                <FileText className="w-3 h-3" />
                Shipping Policy · Section 2
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Scene 03 · Action ──────────────────────────────────────── */}
      <section className="border-b border-[#E5E3DD] bg-white">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-12 items-center">
            <motion.div {...fade(0)} className="order-2 lg:order-1">
              <div className="rounded-xl border border-[#E5E3DD] bg-[#FAF9F5] p-5 max-w-md">
                <p className="text-[14px] leading-relaxed">
                  Great — please keep me posted. I&apos;m ana@example.com
                </p>
              </div>
              <div className="flex items-center gap-3 my-2 ml-8" aria-hidden="true">
                <span className="w-[2px] h-8 bg-[#2F6BFF]" />
              </div>
              <div className="ml-8 sm:ml-16 space-y-3 max-w-md">
                <div className="flex items-start gap-3 rounded-xl border border-[#CBE7D6] bg-[#F2F9F4] p-4">
                  <UserPlus className="w-5 h-5 text-[#3D8B5F] mt-0.5 shrink-0" />
                  <div className="text-[14px]">
                    <p className="font-semibold text-[#17191F]">Lead captured successfully</p>
                    <p className="text-[#656A73] mt-0.5">Ana — ana@example.com</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-[#F0DDB8] bg-[#FBF6EA] p-4">
                  <TicketPlus className="w-5 h-5 text-[#9A6B1A] mt-0.5 shrink-0" />
                  <div className="text-[14px]">
                    <p className="font-semibold text-[#17191F]">Ticket filed</p>
                    <p className="text-[#656A73] mt-0.5">“Discount not applied” — priority: high</p>
                  </div>
                </div>
              </div>
              <p className="font-mono text-[11.5px] text-[#858B98] mt-4 ml-8 sm:ml-16">Illustrative outcomes.</p>
            </motion.div>
            <div className="order-1 lg:order-2 lg:pl-6">
              <p className="l-eyebrow">03 — Action</p>
              <h2 className="font-serif-display font-semibold tracking-tight text-3xl md:text-[40px] leading-[1.08] mb-5">
                A useful answer can move things forward.
              </h2>
              <p className="text-[#656A73] text-[16px] leading-relaxed max-w-lg">
                The same chatbot qualifies visitors into saved leads and files
                tracked support tickets — validated server-side, scoped to your
                workspace, and only where you switched the actions on.
              </p>
              <p className="font-serif-display italic text-[17px] text-[#858B98] mt-8">
                the conversation does the paperwork —
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Setup path ─────────────────────────────────────────────── */}
      <section id="how" className="border-b border-[#E5E3DD] scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-24">
          <p className="l-eyebrow">Setup</p>
          <h2 className="font-serif-display font-semibold tracking-tight text-3xl md:text-[40px] leading-[1.08] mb-4">
            From signup to embedded assistant.
          </h2>
          <p className="text-[#656A73] text-[16px] mb-14 max-w-xl">
            Each step lives in the dashboard, in this order.
          </p>
          <ol className="max-w-3xl">
            {SETUP_STEPS.map((s, i) => (
              <motion.li
                key={s.n}
                {...fade(0.05 * i)}
                className={`flex gap-6 pb-10 last:pb-0 relative ${i % 2 === 1 ? "lg:ml-20" : ""}`}
              >
                {i < SETUP_STEPS.length - 1 && (
                  <span className="absolute left-[21px] top-14 bottom-0 w-[2px] bg-[#E5E3DD]" aria-hidden="true" />
                )}
                <span className="flex items-center justify-center w-11 h-11 rounded-full bg-white border-2 border-[#2F6BFF] text-[#2F6BFF] font-mono text-[13px] font-semibold shrink-0 relative">
                  {s.n}
                </span>
                <div className="pt-1">
                  <p className="font-serif-display font-semibold text-[21px] mb-1">{s.t}</p>
                  <p className="text-[14.5px] text-[#656A73] leading-relaxed max-w-md">{s.d}</p>
                </div>
              </motion.li>
            ))}
          </ol>
          <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-8 items-center rounded-xl border border-[#E5E3DD] bg-white p-6 md:p-8 mt-14">
            <div>
              <p className="font-serif-display font-semibold text-[21px] mb-2">The install step, up close.</p>
              <p className="text-[14px] text-[#656A73] leading-relaxed">
                Paste before <code className="font-mono text-[12.5px] bg-[#F1F3F7] border border-[#E5E3DD] rounded px-1.5 py-0.5">&lt;/body&gt;</code> on
                WordPress, Webflow, Shopify, Wix, or plain HTML. No secrets inside —
                only a public chatbot ID and API URL.
              </p>
            </div>
            <pre className="font-mono text-[13px] leading-relaxed overflow-x-auto text-[#17191F] bg-[#F1F3F7] border border-[#E5E3DD] rounded-lg p-5">
{`<script
  src="https://your-app.com/widget.js"
  data-chatbot-id="YOUR_PUBLIC_ID"
  data-api-url="https://your-api.com/api"
  async
></script>`}
            </pre>
          </div>
        </div>
      </section>

      {/* ── Pricing (preserved beta model) ─────────────────────────── */}
      <section id="pricing" className="border-b border-[#E5E3DD] bg-white scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="l-eyebrow">Pricing</p>
            <h2 className="font-serif-display font-semibold tracking-tight text-3xl md:text-[40px] leading-[1.08] mb-5">
              Free while in beta. Priced honestly after.
            </h2>
            <p className="text-[#656A73] text-[16px] leading-relaxed max-w-md">
              We haven&apos;t finalized paid plans, so we won&apos;t invent them here.
              Everything included today is at no cost — beta users will carry
              founding terms into paid plans.
            </p>
          </div>
          <div className="l-card p-7 lg:ml-6" style={{ borderColor: "rgba(47,107,255,0.4)" }}>
            <div className="flex items-baseline justify-between mb-1">
              <p className="font-serif-display font-semibold text-xl">Beta</p>
              <p className="font-serif-display font-semibold text-3xl">₹0</p>
            </div>
            <p className="text-[13px] text-[#858B98] mb-6">Free during the beta period. No credit card.</p>
            <ul className="space-y-2.5 mb-8">
              {[
                "1 configurable chatbot",
                "Document + website knowledge base",
                "Embed widget for any site",
                "Lead capture and support tickets",
                "Conversations and analytics",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[14.5px]">
                  <Check className="w-[18px] h-[18px] text-[#3D8B5F] mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href={primaryHref}
              className="l-btn-primary flex items-center justify-center gap-2 px-6 py-3 text-[15px] font-semibold"
            >
              {primaryLabel}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ (preserved) ────────────────────────────────────────── */}
      <section id="faq" className="border-b border-[#E5E3DD] scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-24">
          <p className="l-eyebrow">FAQ</p>
          <h2 className="font-serif-display font-semibold tracking-tight text-3xl md:text-[40px] leading-[1.08] mb-10">
            Answers, before you ask.
          </h2>
          <Faq />
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────── */}
      <section className="bg-[#F1F3F7] border-b border-[#E5E3DD]">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-24">
          <p className="l-eyebrow">Begin</p>
          <h2 className="font-serif-display font-semibold tracking-tight text-4xl md:text-[56px] leading-[1.05] max-w-3xl mb-8">
            Your docs already know the answers. <span className="text-[#2F6BFF]">Put them to work.</span>
          </h2>
          <Link
            href={primaryHref}
            className="l-btn-primary inline-flex items-center gap-2 px-7 py-3.5 text-[15px] font-semibold"
          >
            {primaryLabel}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <SiteFooter />
      <WidgetEmbed />
    </div>
  );
}
