"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { documentsAPI } from "@/services/api";
import { apiErrorMessage } from "@/lib/utils";
import { AlertBanner } from "@/components/ui/alert-banner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { Document } from "@/types";
import {
  Upload,
  FileText,
  Globe,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Search,
} from "lucide-react";

export default function KnowledgeBasePage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [crawling, setCrawling] = useState(false);
  const [crawlUrl, setCrawlUrl] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async () => {
    try {
      const { data } = await documentsAPI.list();
      setDocuments(data.documents);
    } catch (err) {
      console.error("Failed to fetch documents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      fetchDocuments();
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        await documentsAPI.upload(formData);
      }
      await fetchDocuments();
    } catch (err) {
      setError(apiErrorMessage(err, "Upload failed"));
    } finally {
      setUploading(false);
    }
  };

  const handleCrawl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!crawlUrl) return;

    setCrawling(true);
    setError(null);
    try {
      await documentsAPI.crawlWebsite({ url: crawlUrl, max_pages: 20 });
      setCrawlUrl("");
      await fetchDocuments();
    } catch (err) {
      setError(apiErrorMessage(err, "Crawl failed"));
    } finally {
      setCrawling(false);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await documentsAPI.delete(pendingDelete);
      setDocuments((prev) => prev.filter((d) => d.id !== pendingDelete));
      setPendingDelete(null);
    } catch {
      setError("Failed to delete document");
    } finally {
      setDeleting(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "processing":
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case "pending":
        return <Clock className="w-4 h-4 text-amber-500" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-rose-500" />;
      default:
        return null;
    }
  };

  const filteredDocs = documents.filter((d) =>
    d.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold">Knowledge Base</h1>
        <p className="text-[var(--text-secondary)] mt-1">
          Upload documents and import websites to train your AI chatbot
        </p>
      </motion.div>

      <AlertBanner message={error} onDismiss={() => setError(null)} />

      {/* Upload & Crawl */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* File Upload */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div
            className={`glass-card p-8 text-center cursor-pointer transition-all ${
              dragOver
                ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/5"
                : "hover:border-[var(--border-secondary)]"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              multiple
              onChange={(e) => handleUpload(e.target.files)}
              className="hidden"
            />

            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center mx-auto mb-4">
              {uploading ? (
                <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />
              ) : (
                <Upload className="w-7 h-7 text-blue-500" />
              )}
            </div>

            <h3 className="font-semibold mb-1">
              {uploading ? "Uploading..." : "Upload Documents"}
            </h3>
            <p className="text-sm text-[var(--text-tertiary)]">
              Drag & drop or click to browse
            </p>
            <p className="text-xs text-[var(--text-tertiary)] mt-2">
              Supports PDF, DOCX, TXT (max 10MB)
            </p>
          </div>
        </motion.div>

        {/* Website Import */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="glass-card p-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center mb-4">
              <Globe className="w-7 h-7 text-emerald-500" />
            </div>

            <h3 className="font-semibold mb-1">Import from Website</h3>
            <p className="text-sm text-[var(--text-tertiary)] mb-4">
              Crawl up to 20 pages from your website
            </p>

            <form onSubmit={handleCrawl} className="flex gap-2">
              <input
                type="url"
                value={crawlUrl}
                onChange={(e) => setCrawlUrl(e.target.value)}
                placeholder="https://yourcompany.com"
                required
                className="flex-1 px-4 py-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] text-sm"
              />
              <button
                type="submit"
                disabled={crawling}
                className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-medium hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {crawling ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Crawl"
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>

      {/* Documents List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            Documents ({documents.length})
          </h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents..."
              className="pl-9 pr-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] w-64"
            />
          </div>
        </div>

        {loading ? (
          <div className="glass-card p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[var(--text-tertiary)]" />
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-[var(--text-tertiary)] mb-3" />
            <p className="text-[var(--text-secondary)]">No documents yet</p>
            <p className="text-sm text-[var(--text-tertiary)]">
              Upload files or import a website to get started
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {filteredDocs.map((doc, index) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.03 }}
                  className="glass-card glass-card-hover p-4 flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-lg bg-[var(--bg-hover)] flex items-center justify-center shrink-0">
                    {doc.file_type === "website" ? (
                      <Globe className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <FileText className="w-5 h-5 text-blue-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{doc.filename}</p>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      {doc.file_type.toUpperCase()} · {doc.chunk_count} chunks ·{" "}
                      {new Date(doc.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      {statusIcon(doc.status)}
                      <span
                        className={`text-xs capitalize ${
                          doc.status === "completed"
                            ? "text-emerald-500"
                            : doc.status === "failed"
                            ? "text-rose-500"
                            : "text-[var(--text-tertiary)]"
                        }`}
                      >
                        {doc.status}
                      </span>
                    </div>

                    <button
                      onClick={() => setPendingDelete(doc.id)}
                      className="p-2 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-rose-500 transition-colors"
                      aria-label={`Delete ${doc.filename}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete document?"
        description="This will remove the document and all of its processed knowledge. This cannot be undone."
        confirmLabel="Delete"
        confirming={deleting}
        onConfirm={handleDelete}
        onCancel={() => {
          if (!deleting) setPendingDelete(null);
        }}
      />
    </div>
  );
}
