import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue to-primary animate-pulse" />
        <p className="text-muted text-sm flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading...
        </p>
      </div>
    </div>
  );
}
