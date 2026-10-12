import { Bell, Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export function TopNav() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-8 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="flex w-full max-w-sm items-center">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input 
            type="search" 
            placeholder="Search anything..." 
            className="w-full pl-9 bg-card border-white/5 h-10 rounded-[12px] focus-visible:ring-1"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-muted hover:text-white transition-colors rounded-full hover:bg-white/5">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background"></span>
        </button>
      </div>
    </header>
  )
}
