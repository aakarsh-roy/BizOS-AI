import { Search, Menu } from "lucide-react"
import { Input } from "@/components/ui/input"

export function TopNav({ onMenuClick, onSearchClick }: { onMenuClick?: () => void; onSearchClick?: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/80 px-4 md:px-8 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-2">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="p-2 -ml-1 text-muted hover:text-white transition-colors rounded-lg hover:bg-white/5 md:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <div className="relative w-full max-w-sm hidden sm:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted pointer-events-none" />
          <Input
            type="search"
            placeholder="Search pages and actions..."
            readOnly
            onClick={onSearchClick}
            onFocus={(e) => {
              e.target.blur();
              onSearchClick?.();
            }}
            aria-label="Open command palette"
            className="w-full pl-9 pr-12 bg-card border-white/5 h-10 rounded-[12px] focus-visible:ring-1 cursor-pointer"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] px-1.5 py-0.5 rounded border border-border text-muted pointer-events-none">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="hidden md:inline text-xs text-muted/60">Press ⌘K for quick actions</span>
      </div>
    </header>
  )
}
