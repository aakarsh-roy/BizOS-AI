import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  Bot,
  FileText,
  BarChart3,
  Ticket,
  LogOut
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Tickets", href: "/tickets", icon: Ticket },
  { name: "Leads", href: "/leads", icon: Users },
  { name: "Documents", href: "/knowledge", icon: FileText },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Integration", href: "/integration", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, company, logout } = useAuth()

  return (
    <aside className="sticky top-0 h-screen w-[270px] flex-col border-r border-border bg-sidebar hidden md:flex z-40">
      <div className="flex h-16 items-center px-6">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue to-primary flex items-center justify-center">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <span className="font-semibold text-lg tracking-tight text-white">BizOS AI</span>
        </div>
      </div>
      
      <div className="px-4 py-4 flex-1">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            const Icon = item.icon
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "text-white" 
                    : "text-muted hover:text-white hover:bg-white/5"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/20 to-transparent border border-primary/20"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon className={cn("h-5 w-5 z-10", isActive ? "text-primary" : "")} />
                <span className="z-10">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </div>
      
      <div className="p-4 mt-auto border-t border-border">
        <div className="flex items-center justify-between px-2 py-2 group">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-surface border border-border flex items-center justify-center overflow-hidden">
              <span className="text-sm font-semibold text-primary">{user?.name?.[0] || 'A'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white leading-none max-w-[120px] truncate">{user?.name || 'Aakarsh Roy'}</span>
              <span className="text-xs text-muted mt-1 max-w-[120px] truncate">{company?.name || 'Acme Corp'}</span>
            </div>
          </div>
          <button 
            onClick={logout}
            className="p-2 text-muted hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
