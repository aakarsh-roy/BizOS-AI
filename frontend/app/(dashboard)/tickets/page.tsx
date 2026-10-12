"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ticketsAPI } from "@/services/api";
import type { Ticket } from "@/types";
import {
  Plus,
  Search,
  Ticket as TicketIcon,
  Loader2,
  X,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";

const statusColors: Record<string, string> = {
  open: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  in_progress: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  resolved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  closed: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

const priorityColors: Record<string, string> = {
  low: "bg-zinc-500/10 text-zinc-400",
  medium: "bg-blue-500/10 text-blue-400",
  high: "bg-amber-500/10 text-amber-400",
  urgent: "bg-rose-500/10 text-rose-400",
};

const statusIcons: Record<string, any> = {
  open: AlertCircle,
  in_progress: Clock,
  resolved: CheckCircle2,
  closed: XCircle,
};

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [creating, setCreating] = useState(false);

  // Create form state
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriority, setNewPriority] = useState("medium");

  const fetchTickets = async () => {
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      const { data } = await ticketsAPI.list(params);
      setTickets(data.tickets);
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await ticketsAPI.create({
        title: newTitle,
        description: newDescription,
        priority: newPriority,
      });
      setNewTitle("");
      setNewDescription("");
      setNewPriority("medium");
      setShowCreate(false);
      await fetchTickets();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to create ticket");
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      await ticketsAPI.update(ticketId, { status: newStatus });
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus as any } : t))
      );
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const filteredTickets = tickets.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold">Tickets</h1>
          <p className="text-muted mt-1">
            Manage support tickets and track issues
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium hover:from-blue-600 hover:to-purple-700 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Ticket
        </button>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-3 mb-6"
      >
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted/60" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tickets..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface border border-border text-sm text-foreground placeholder:text-muted/60"
          />
        </div>
        <div className="flex gap-2">
          {["", "open", "in_progress", "resolved", "closed"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                statusFilter === status
                  ? "bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] border-[var(--accent-blue)]/20"
                  : "border-border text-muted/60 hover:text-muted hover:bg-white/5"
              }`}
            >
              {status ? status.replace("_", " ") : "All"}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Ticket List */}
      {loading ? (
        <div className="bg-card border border-border premium-shadow p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted/60" />
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="bg-card border border-border premium-shadow p-12 text-center">
          <TicketIcon className="w-12 h-12 mx-auto text-muted/60 mb-3" />
          <p className="text-muted">No tickets found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTickets.map((ticket, index) => {
            const StatusIcon = statusIcons[ticket.status] || AlertCircle;
            return (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="bg-card border border-border premium-shadow bg-card border border-border premium-shadow-hover p-5"
              >
                <div className="flex items-start gap-4">
                  <StatusIcon className="w-5 h-5 mt-0.5 shrink-0 text-muted/60" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium mb-1">{ticket.title}</h3>
                    <p className="text-sm text-muted line-clamp-2">
                      {ticket.description}
                    </p>
                    <div className="flex items-center gap-3 mt-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium border ${statusColors[ticket.status]}`}
                      >
                        {ticket.status.replace("_", " ")}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${priorityColors[ticket.priority]}`}
                      >
                        {ticket.priority}
                      </span>
                      <span className="text-xs text-muted/60">
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <select
                    value={ticket.status}
                    onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                    className="px-2 py-1 rounded-lg bg-background border border-border text-xs text-muted appearance-none cursor-pointer"
                  >
                    <option value="open" className="bg-popover text-foreground">Open</option>
                    <option value="in_progress" className="bg-popover text-foreground">In Progress</option>
                    <option value="resolved" className="bg-popover text-foreground">Resolved</option>
                    <option value="closed" className="bg-popover text-foreground">Closed</option>
                  </select>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Ticket Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border premium-shadow p-6 w-full max-w-lg"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Create Ticket</h3>
                <button
                  onClick={() => setShowCreate(false)}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-muted/60"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted mb-1.5">
                    Title
                  </label>
                  <input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                    placeholder="Brief issue description"
                    className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    required
                    rows={4}
                    placeholder="Detailed description of the issue"
                    className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-sm resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted mb-1.5">
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-sm appearance-none cursor-pointer"
                  >
                    <option value="low" className="bg-popover text-foreground">Low</option>
                    <option value="medium" className="bg-popover text-foreground">Medium</option>
                    <option value="high" className="bg-popover text-foreground">High</option>
                    <option value="urgent" className="bg-popover text-foreground">Urgent</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={creating}
                  className="w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Create Ticket"
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
