"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Menu, X, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

const LINKS = [
  { label: "Product", href: "#product" },
  { label: "How it works", href: "#how" },
  { label: "Demo", href: "#demo" },
  { label: "Pricing", href: "#pricing" },
];

export function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-2.5 rounded-md">
      <div className="h-8 w-8 rounded-[8px] bg-[#2F6BFF] flex items-center justify-center">
        <Bot className="h-5 w-5 text-white" />
      </div>
      <span className="font-display font-bold text-[17px] tracking-tight text-[#17191F]">
        BizOS&nbsp;AI
      </span>
    </Link>
  );
}

export function SiteHeader() {
  const { isAuthenticated, company } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const reduced = usePrefersReducedMotion();
  const primaryHref = isAuthenticated ? (company ? "/dashboard" : "/onboarding") : "/register";

  return (
    <header className="sticky top-0 z-40 border-b border-[#E4E7EC] bg-white/85 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
        <Wordmark />
        <nav className="hidden md:flex items-center gap-7 text-[14px] text-[#626875]" aria-label="Primary">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-[#17191F] transition-colors rounded-sm">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-2">
          {!isAuthenticated && (
            <Link
              href="/login"
              className="text-[14px] text-[#626875] hover:text-[#17191F] transition-colors px-3 py-2 rounded-md"
            >
              Sign in
            </Link>
          )}
          <Link
            href={primaryHref}
            className="l-btn-primary text-[14px] font-semibold px-4 py-2"
          >
            {isAuthenticated ? "Open dashboard" : "Get started"}
          </Link>
        </div>
        <button
          className="md:hidden p-2 -mr-1 text-[#626875] hover:text-[#17191F] rounded-md"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            initial={reduced ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden border-t border-[#E4E7EC] bg-white"
            aria-label="Mobile"
          >
            <div className="px-4 py-3 flex flex-col">
              {LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="py-3 text-[15px] text-[#626875] hover:text-[#17191F] border-b border-[#E4E7EC] last:border-0"
                >
                  {l.label}
                </a>
              ))}
              <div className="flex gap-2 py-3">
                {!isAuthenticated && (
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="l-btn-secondary flex-1 text-center text-[14px] font-medium px-4 py-2.5"
                  >
                    Sign in
                  </Link>
                )}
                <Link
                  href={primaryHref}
                  onClick={() => setMenuOpen(false)}
                  className="l-btn-primary flex-1 text-center text-[14px] font-semibold px-4 py-2.5 inline-flex items-center justify-center gap-1.5"
                >
                  {isAuthenticated ? "Dashboard" : "Get started"}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
