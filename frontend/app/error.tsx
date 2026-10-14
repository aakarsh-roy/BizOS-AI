"use client";

import { useEffect } from "react";
import { Bot, AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background dot-grid relative overflow-hidden px-4">
      <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-rose-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="relative text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-rose-400" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-3">Something went wrong</h1>
        <p className="text-muted mb-8">
          An unexpected error occurred. Please try again.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="px-5 py-2.5 rounded-xl btn-primary text-sm font-medium flex items-center gap-2"
          >
            <Bot className="w-4 h-4" />
            Try again
          </button>
          <a
            href="/dashboard"
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-muted hover:text-white border border-border hover:bg-white/5 transition-colors"
          >
            Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
