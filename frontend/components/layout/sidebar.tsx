"use client";

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard,
  Users,
  Settings,
  Bot,
  FileText,
  BarChart3,
  Ticket,
  MessageSquare,
  LogOut,
  X
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"

const navigation = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "My Chatbot", href: "/chatbot", icon: Bot },
  { name: "Conversations", href: "/chat", icon: MessageSquare },
  { name: "Knowledge Base", href: "/knowledge", icon: FileText },
  { name: "Leads", href: "/leads", icon: Users },
  { name: "Support Tickets", href: "/tickets", icon: Ticket },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Install", href: "/integration", icon: Settings },
]

function SidebarNav({ onNavigate, activeId }: { onNavigate?: () => void; activeId: string }) {
  const pathname = usePathname()
  const { user, company, logout } = useAuth()

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-6">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue to-primary flex items-center justify-center">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <span className="font-semibold text-lg tracking-tight text-white">BizOS AI</span>
        </div>
      </div>

      <div className="px-4 py-4 flex-1 overflow-y-auto">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            const Icon = item.icon

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "text-white"
                    : "text-muted hover:text-white hover:bg-white/5"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId={activeId}
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
            aria-label="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export function Sidebar() {
  return (
    <aside className="sticky top-0 h-screen w-[270px] flex-col border-r border-border bg-sidebar hidden md:flex z-40">
      <SidebarNav activeId="sidebar-active" />
    </aside>
  )
}

export function MobileSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            aria-hidden="true"
          />
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed top-0 left-0 z-50 h-full w-[280px] border-r border-border bg-sidebar md:hidden flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-muted hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarNav onNavigate={onClose} activeId="mobile-sidebar-active" />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
