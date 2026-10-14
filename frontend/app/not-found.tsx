import Link from "next/link";
import { Bot } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background dot-grid relative overflow-hidden px-4">
      <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="relative text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue to-primary flex items-center justify-center mx-auto mb-6">
          <Bot className="w-8 h-8 text-white" />
        </div>
        <p className="text-sm font-medium text-primary mb-2">404</p>
        <h1 className="text-3xl font-bold text-foreground mb-3">Page not found</h1>
        <p className="text-muted mb-8">
          The page you&apos;re looking for doesn&apos;t exist or was moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-xl btn-primary text-sm font-medium"
          >
            Go to dashboard
          </Link>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-muted hover:text-white border border-border hover:bg-white/5 transition-colors"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
