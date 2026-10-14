"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlertBannerProps {
  message: string | null;
  variant?: "error" | "success";
  onDismiss?: () => void;
}

export function AlertBanner({ message, variant = "error", onDismiss }: AlertBannerProps) {
  const isError = variant === "error";
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          role="alert"
          className={cn(
            "flex items-start gap-3 rounded-xl border p-4 text-sm mb-6",
            isError
              ? "border-rose-500/20 bg-rose-500/10 text-rose-200"
              : "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
          )}
        >
          {isError ? (
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          ) : (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          )}
          <p className="flex-1">{message}</p>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
