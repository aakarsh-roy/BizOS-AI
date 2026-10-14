"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { GettingStarted } from "@/components/dashboard/getting-started";
import { analyticsAPI, chatbotAPI } from "@/services/api";
import type { AnalyticsOverview, ChatbotConfig } from "@/types";
import {
  FileText,
  MessageSquare,
  Ticket,
  Users,
  ArrowUpRight,
  TrendingUp,
  Bot,
  type LucideIcon,
} from "lucide-react";

const statIcons: Record<string, LucideIcon> = {
  total_documents: FileText,
  total_chats: MessageSquare,
  total_tickets: Ticket,
  total_leads: Users,
};

const statLabels: Record<string, string> = {
  total_documents: "Documents",
  total_chats: "Total Chats",
  total_tickets: "Tickets",
  total_leads: "Leads",
};

const statColors: Record<string, string> = {
  total_documents: "from-blue-500 to-cyan-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]",
  total_chats: "from-violet-500 to-purple-500 shadow-[0_0_15px_rgba(139,92,246,0.3)]",
  total_tickets: "from-amber-500 to-orange-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]",
  total_leads: "from-emerald-500 to-teal-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]",
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  const { user, company } = useAuth();
  const [stats, setStats] = useState<AnalyticsOverview | null>(null);
  const [chatbot, setChatbot] = useState<ChatbotConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, chatbotRes] = await Promise.all([
          analyticsAPI.overview(),
          chatbotAPI.getConfig(),
        ]);
        setStats(statsRes.data.stats);
        setChatbot(chatbotRes.data);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statKeys = [
    "total_documents",
    "total_chats",
    "total_tickets",
    "total_leads",
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold tracking-tight text-white mb-2"
        >
          Welcome back, {user?.name?.split(" ")[0]} 👋
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-muted text-lg"
        >
          Here&apos;s an overview of <span className="text-white font-medium">{company?.name}&apos;s</span> AI workspace.
        </motion.p>
      </div>

      {/* Getting Started Checklist */}
      {!loading && <GettingStarted stats={stats} chatbot={chatbot} />}

      {/* Stats Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-12"
      >
        {statKeys.map((key) => {
          const Icon = statIcons[key];
          const value = stats ? stats[key as keyof AnalyticsOverview] : 0;
          return (
            <motion.div
              key={key}
              variants={item}
            >
              <Card hover className="p-6 group relative overflow-hidden h-full flex flex-col justify-between">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="flex items-start justify-between mb-4 relative z-10">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${statColors[key]} flex items-center justify-center border border-white/20`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-muted opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-1 group-hover:translate-y-0" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-white relative z-10 tracking-tight">
                    {loading ? (
                      <span className="inline-block w-16 h-9 bg-white/10 rounded animate-pulse" />
                    ) : (
                      value
                    )}
                  </p>
                  <p className="text-sm text-muted mt-1 font-medium relative z-10 uppercase tracking-wider">
                    {statLabels[key]}
                  </p>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* My Chatbot */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white tracking-tight">My Chatbot</h2>
        </div>

        <Link href="/chat" className="block">
          <Card
            hover
            className="p-8 group relative overflow-hidden bg-card/50"
          >
            <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 opacity-20 blur-[40px] group-hover:opacity-40 transition-opacity duration-500" />
            <div className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 opacity-10 blur-[40px] group-hover:opacity-30 transition-opacity duration-500" />

            <div className="relative z-10 flex items-start gap-6">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg"
                style={{ backgroundColor: chatbot?.widget_color || "#2563eb" }}
              >
                <Bot className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xl text-white mb-1">
                    {chatbot?.name || "Your Chatbot"}
                  </h3>
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-white/10 group-hover:border-white/20 transition-all duration-300">
                    <ArrowUpRight className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
                  </div>
                </div>
                <p className="text-sm text-muted leading-relaxed">
                  {chatbot?.welcome_message ||
                    "Test your chatbot, review visitor conversations, and see captured leads and tickets."}
                </p>
                <div className="flex items-center gap-2 mt-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 pulse-dot shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <span className="text-xs font-semibold text-muted uppercase tracking-widest">Active</span>
                </div>
              </div>
            </div>
          </Card>
        </Link>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-12 mb-8"
      >
        <h2 className="text-2xl font-bold text-white tracking-tight mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/knowledge">
            <Card hover className="p-6 flex items-center gap-5 group border-blue-500/10">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)] group-hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-shadow">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white">Upload Documents</p>
                <p className="text-sm text-muted mt-0.5">
                  Add to your knowledge base
                </p>
              </div>
              <ArrowUpRight className="w-5 h-5 text-muted opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0" />
            </Card>
          </Link>

          <Link href="/chatbot">
            <Card hover className="p-6 flex items-center gap-5 group border-amber-500/10">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)] group-hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] transition-shadow">
                <Bot className="w-6 h-6 text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white">Configure Chatbot</p>
                <p className="text-sm text-muted mt-0.5">
                  Name, welcome message, actions
                </p>
              </div>
              <ArrowUpRight className="w-5 h-5 text-muted opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0" />
            </Card>
          </Link>

          <Link href="/integration">
            <Card hover className="p-6 flex items-center gap-5 group border-purple-500/10">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)] group-hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] transition-shadow">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white">Install on Website</p>
                <p className="text-sm text-muted mt-0.5">
                  Copy your embed snippet
                </p>
              </div>
              <ArrowUpRight className="w-5 h-5 text-muted opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0" />
            </Card>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
