"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { leadsAPI } from "@/services/api";
import { apiErrorMessage } from "@/lib/utils";
import { AlertBanner } from "@/components/ui/alert-banner";
import { useEscapeKey } from "@/hooks/use-escape-key";
import type { Lead } from "@/types";
import {
  Search,
  Users,
  Loader2,
  X,
  Mail,
  Phone,
  StickyNote,
  UserPlus,
} from "lucide-react";

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  useEscapeKey(showCreate, () => setShowCreate(false));
  useEscapeKey(selectedLead !== null, () => setSelectedLead(null));

  const fetchLeads = async () => {
    try {
      const params: Record<string, string> = {};
      if (searchQuery) params.search = searchQuery;
      const { data } = await leadsAPI.list(params);
      setLeads(data.leads);
    } catch (err) {
      console.error("Failed to fetch leads:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      fetchLeads();
    }, 0);
    return () => clearTimeout(t);
    // fetchLeads intentionally runs once on mount; it reads the current searchQuery
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== undefined) fetchLeads();
    }, 300);
    return () => clearTimeout(timer);
    // fetchLeads closes over searchQuery, which is the trigger for this debounce
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      await leadsAPI.create({
        name: newName,
        email: newEmail,
        phone: newPhone || undefined,
        notes: newNotes || undefined,
      });
      setNewName("");
      setNewEmail("");
      setNewPhone("");
      setNewNotes("");
      setShowCreate(false);
      await fetchLeads();
    } catch (err) {
      setCreateError(apiErrorMessage(err, "Failed to create lead"));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold">Leads</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Track and manage your sales leads
          </p>
        </div>
        <button
          onClick={() => {
            setCreateError(null);
            setShowCreate(true);
          }}
          className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-medium hover:from-emerald-600 hover:to-teal-700 transition-all flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Add Lead
        </button>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
          />
        </div>
      </motion.div>

      {/* Leads Grid */}
      {loading ? (
        <div className="glass-card p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[var(--text-tertiary)]" />
        </div>
      ) : leads.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Users className="w-12 h-12 mx-auto text-[var(--text-tertiary)] mb-3" />
          <p className="text-[var(--text-secondary)]">No leads found</p>
          <p className="text-sm text-[var(--text-tertiary)]">
            Leads will be captured by your chatbot or added manually
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {leads.map((lead, index) => (
            <motion.div
              key={lead.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => setSelectedLead(lead)}
              className="glass-card glass-card-hover p-5 cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {lead.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium">{lead.name}</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Mail className="w-3 h-3 text-[var(--text-tertiary)]" />
                    <span className="text-sm text-[var(--text-secondary)] truncate">
                      {lead.email}
                    </span>
                  </div>
                  {lead.phone && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Phone className="w-3 h-3 text-[var(--text-tertiary)]" />
                      <span className="text-sm text-[var(--text-secondary)]">
                        {lead.phone}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              {lead.notes && (
                <p className="text-xs text-[var(--text-tertiary)] mt-3 line-clamp-2">
                  {lead.notes}
                </p>
              )}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border-primary)]">
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                  {lead.source}
                </span>
                <span className="text-xs text-[var(--text-tertiary)]">
                  {new Date(lead.created_at).toLocaleDateString()}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Lead Detail Modal */}
      <AnimatePresence>
        {selectedLead && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedLead(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Lead details"
              className="glass-card p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Lead Details</h3>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-xl font-bold">
                  {selectedLead.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-lg font-semibold">{selectedLead.name}</h4>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {selectedLead.source}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-primary)]">
                  <Mail className="w-4 h-4 text-[var(--text-tertiary)]" />
                  <span className="text-sm">{selectedLead.email}</span>
                </div>
                {selectedLead.phone && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-primary)]">
                    <Phone className="w-4 h-4 text-[var(--text-tertiary)]" />
                    <span className="text-sm">{selectedLead.phone}</span>
                  </div>
                )}
                {selectedLead.notes && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--bg-primary)]">
                    <StickyNote className="w-4 h-4 text-[var(--text-tertiary)] mt-0.5" />
                    <span className="text-sm">{selectedLead.notes}</span>
                  </div>
                )}
              </div>

              <p className="text-xs text-[var(--text-tertiary)] mt-4">
                Created: {new Date(selectedLead.created_at).toLocaleString()}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Lead Modal */}
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
              role="dialog"
              aria-modal="true"
              aria-label="Add lead"
              className="glass-card p-6 w-full max-w-lg"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Add Lead</h3>
                <button
                  onClick={() => setShowCreate(false)}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <AlertBanner message={createError} onDismiss={() => setCreateError(null)} />
                <div>
                  <label htmlFor="lead-name" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                    Name *
                  </label>
                  <input
                    id="lead-name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                    placeholder="Full name"
                    className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)] text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="lead-email" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                    Email *
                  </label>
                  <input
                    id="lead-email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    placeholder="email@example.com"
                    className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)] text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="lead-phone" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                    Phone
                  </label>
                  <input
                    id="lead-phone"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+1 234 567 8900"
                    className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)] text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="lead-notes" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                    Notes
                  </label>
                  <textarea
                    id="lead-notes"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    rows={3}
                    placeholder="Any notes about this lead..."
                    className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)] text-sm resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={creating}
                  className="w-full py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Add Lead"
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
