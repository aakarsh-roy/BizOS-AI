"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { analyticsAPI } from "@/services/api";
import type { AnalyticsOverview, ChartData } from "@/types";
import { Loader2, TrendingUp, BarChart3, PieChart as PieIcon } from "lucide-react";

const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#f43f5e", "#06b6d4"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 text-sm">
        <p className="font-medium mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const [stats, setStats] = useState<AnalyticsOverview | null>(null);
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, chartsRes] = await Promise.all([
          analyticsAPI.overview(),
          analyticsAPI.charts(),
        ]);
        setStats(statsRes.data.stats);
        setCharts(chartsRes.data.charts);
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--text-tertiary)]" />
      </div>
    );
  }

  // Transform data for charts
  const agentUsageData = charts?.agent_usage
    ? Object.entries(charts.agent_usage).map(([name, count]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        conversations: count,
      }))
    : [];

  const ticketsPriorityData = charts?.tickets_by_priority
    ? Object.entries(charts.tickets_by_priority).map(([name, count]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value: count,
      }))
    : [];

  const dailyChatsData = charts?.daily_chats || [];
  const dailyLeadsData = charts?.daily_leads || [];

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-[var(--text-secondary)] mt-1">
          Track your AI workspace performance and usage
        </p>
      </motion.div>

      {/* Overview Stats */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          {[
            { label: "Total Chats", value: stats.total_chats, color: "text-blue-400" },
            { label: "Total Leads", value: stats.total_leads, color: "text-emerald-400" },
            { label: "Open Tickets", value: stats.open_tickets, color: "text-amber-400" },
            { label: "Resolved", value: stats.resolved_tickets, color: "text-violet-400" },
          ].map((stat, i) => (
            <div key={i} className="glass-card p-5">
              <p className="text-sm text-[var(--text-tertiary)]">{stat.label}</p>
              <p className={`text-3xl font-bold mt-1 ${stat.color}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agent Usage Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-[var(--text-tertiary)]" />
            <h3 className="font-semibold">Agent Usage</h3>
          </div>
          {agentUsageData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={agentUsageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#71717a", fontSize: 12 }}
                  axisLine={{ stroke: "#27272a" }}
                />
                <YAxis
                  tick={{ fill: "#71717a", fontSize: 12 }}
                  axisLine={{ stroke: "#27272a" }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="conversations" radius={[6, 6, 0, 0]}>
                  {agentUsageData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-[var(--text-tertiary)]">
              No data yet — start chatting with agents
            </div>
          )}
        </motion.div>

        {/* Tickets by Priority Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <PieIcon className="w-5 h-5 text-[var(--text-tertiary)]" />
            <h3 className="font-semibold">Tickets by Priority</h3>
          </div>
          {ticketsPriorityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={ticketsPriorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {ticketsPriorityData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(value) => (
                    <span style={{ color: "#a1a1aa", fontSize: 12 }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-[var(--text-tertiary)]">
              No tickets yet
            </div>
          )}
        </motion.div>

        {/* Daily Chats Line Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-[var(--text-tertiary)]" />
            <h3 className="font-semibold">Daily Conversations</h3>
          </div>
          {dailyChatsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyChatsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#71717a", fontSize: 12 }}
                  axisLine={{ stroke: "#27272a" }}
                />
                <YAxis
                  tick={{ fill: "#71717a", fontSize: 12 }}
                  axisLine={{ stroke: "#27272a" }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="chats"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-[var(--text-tertiary)]">
              No conversation data yet
            </div>
          )}
        </motion.div>

        {/* Daily Leads Line Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-[var(--text-tertiary)]" />
            <h3 className="font-semibold">Daily Leads</h3>
          </div>
          {dailyLeadsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyLeadsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#71717a", fontSize: 12 }}
                  axisLine={{ stroke: "#27272a" }}
                />
                <YAxis
                  tick={{ fill: "#71717a", fontSize: 12 }}
                  axisLine={{ stroke: "#27272a" }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="leads"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: "#10b981", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-[var(--text-tertiary)]">
              No lead data yet
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
