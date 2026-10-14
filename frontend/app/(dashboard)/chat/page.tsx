"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { chatAPI, chatbotAPI } from "@/services/api";
import type { ChatbotConfig, Conversation, Message, Source, ToolAction } from "@/types";
import {
  Send,
  Loader2,
  Plus,
  MessageSquare,
  ChevronLeft,
  ExternalLink,
  Wrench,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Search,
  TicketPlus,
  ListChecks,
  UserPlus,
  Users,
  FileSearch,
} from "lucide-react";

// Tool display config
const TOOL_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  search_knowledge_base: { icon: <Search className="w-3.5 h-3.5" />, label: "Searching knowledge base", color: "text-blue-400" },
  create_ticket: { icon: <TicketPlus className="w-3.5 h-3.5" />, label: "Creating ticket", color: "text-emerald-400" },
  list_tickets: { icon: <ListChecks className="w-3.5 h-3.5" />, label: "Querying tickets", color: "text-cyan-400" },
  update_ticket: { icon: <Wrench className="w-3.5 h-3.5" />, label: "Updating ticket", color: "text-amber-400" },
  create_lead: { icon: <UserPlus className="w-3.5 h-3.5" />, label: "Saving lead", color: "text-emerald-400" },
  list_leads: { icon: <Users className="w-3.5 h-3.5" />, label: "Querying leads", color: "text-violet-400" },
  list_documents: { icon: <FileSearch className="w-3.5 h-3.5" />, label: "Listing documents", color: "text-teal-400" },
};

interface ToolCallEvent {
  tool: string;
  args: Record<string, unknown>;
}

function ToolCallBadge({ tool, status }: { tool: string; status: "running" | "done" }) {
  const config = TOOL_CONFIG[tool] || { icon: <Wrench className="w-3.5 h-3.5" />, label: tool, color: "text-gray-400" };
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
        status === "running"
          ? "bg-surface border-border animate-pulse"
          : "bg-card border-border"
      }`}
    >
      <span className={config.color}>{config.icon}</span>
      <span className="text-muted">{config.label}</span>
      {status === "running" ? (
        <Loader2 className="w-3 h-3 animate-spin text-muted/60" />
      ) : (
        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
      )}
    </motion.div>
  );
}

function ActionsPanel({ actions }: { actions: ToolAction[] }) {
  const [expanded, setExpanded] = useState(false);
  if (!actions || actions.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-border">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-xs text-muted/60 hover:text-muted transition-colors"
      >
        <Wrench className="w-3 h-3" />
        <span>{actions.length} action{actions.length > 1 ? "s" : ""} taken</span>
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-2">
              {actions.map((action: ToolAction, i: number) => {
                const config = TOOL_CONFIG[action.tool] || { icon: <Wrench className="w-3.5 h-3.5" />, label: action.tool, color: "text-gray-400" };
                const isSuccess = action.result?.success !== false && !action.result?.error;
                return (
                  <div
                    key={i}
                    className="flex items-start gap-2 px-3 py-2 rounded-lg bg-background border border-border text-xs"
                  >
                    <span className={`mt-0.5 ${config.color}`}>{config.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-muted">{config.label}</div>
                      {action.result?.message && (
                        <p className={`mt-0.5 ${isSuccess ? "text-emerald-400" : "text-red-400"}`}>
                          {isSuccess ? "✅" : "❌"} {action.result.message || action.result.error}
                        </p>
                      )}
                      {action.result?.ticket_id && (
                        <p className="mt-0.5 text-muted/60">
                          Ticket ID: {action.result.ticket_id}
                        </p>
                      )}
                      {action.result?.lead_id && (
                        <p className="mt-0.5 text-muted/60">
                          Lead ID: {action.result.lead_id}
                        </p>
                      )}
                      {action.result?.count !== undefined && (
                        <p className="mt-0.5 text-muted/60">
                          Found {action.result.count} result{action.result.count !== 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ChatPage() {
  const [config, setConfig] = useState<ChatbotConfig | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeToolCalls, setActiveToolCalls] = useState<ToolCallEvent[]>([]);
  const [completedToolCalls, setCompletedToolCalls] = useState<ToolAction[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const botName = config?.name || "Assistant";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, streamingContent, activeToolCalls]);

  // Fetch chatbot config + conversations
  useEffect(() => {
    const loadData = async () => {
      try {
        const [cfg, convs] = await Promise.all([
          chatbotAPI.getConfig(),
          chatAPI.listConversations(),
        ]);
        setConfig(cfg.data);
        setConversations(convs.data.conversations);
      } catch (err) {
        console.error("Failed to load chat data:", err);
      }
    };
    loadData();
  }, []);

  // Fetch messages for active conversation
  useEffect(() => {
    if (!activeConversation) {
      const t = setTimeout(() => setMessages([]), 0);
      return () => clearTimeout(t);
    }

    const fetchMessages = async () => {
      try {
        const { data } = await chatAPI.getMessages(activeConversation);
        setMessages(data.messages);
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      }
    };
    const t = setTimeout(() => {
      fetchMessages();
    }, 0);
    return () => clearTimeout(t);
  }, [activeConversation]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setLoading(true);
    setActiveToolCalls([]);
    setCompletedToolCalls([]);

    // Add user message optimistically
    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: userMessage,
      sources: [],
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      setStreaming(true);
      setStreamingContent("");

      const response = await chatAPI.sendStream({
        message: userMessage,
        conversation_id: activeConversation || undefined,
      });

      if (!response.ok) throw new Error("Stream failed");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let sources: Source[] = [];
      let actions: ToolAction[] = [];

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n\n");

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "conversation_id") {
                // Always adopt the server's conversation id (handles stale ids)
                setActiveConversation(data.data);
              } else if (data.type === "tool_call") {
                setActiveToolCalls((prev) => [...prev, data.data]);
              } else if (data.type === "tool_result") {
                setActiveToolCalls((prev) => prev.filter((tc) => tc.tool !== data.data.tool));
                setCompletedToolCalls((prev) => [...prev, data.data]);
              } else if (data.type === "content") {
                fullContent += data.data;
                setStreamingContent(fullContent);
              } else if (data.type === "sources") {
                sources = data.data;
              } else if (data.type === "actions") {
                actions = data.data;
              } else if (data.type === "error") {
                fullContent += `\n\n⚠️ ${data.data}`;
                setStreamingContent(fullContent);
              }
            } catch {
              // skip malformed JSON
            }
          }
        }
      }

      setStreaming(false);
      setStreamingContent("");
      setActiveToolCalls([]);

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: fullContent,
        sources,
        actions,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      const { data: convData } = await chatAPI.listConversations();
      setConversations(convData.conversations);
    } catch (err) {
      console.error("Chat error:", err);
      // Fallback to non-streaming
      try {
        const { data } = await chatAPI.send({
          message: userMessage,
          conversation_id: activeConversation || undefined,
        });

        setActiveConversation(data.conversation_id);

        const assistantMsg: Message = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.message,
          sources: data.sources || [],
          actions: data.actions || [],
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);

        const { data: convData } = await chatAPI.listConversations();
        setConversations(convData.conversations);
      } catch (fallbackErr) {
        console.error("Fallback failed:", fallbackErr);
        const errorMsg: Message = {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "Sorry, I couldn't process your message. Please make sure the backend server is running and try again.",
          sources: [],
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } finally {
      setLoading(false);
      setStreaming(false);
      setActiveToolCalls([]);
      setCompletedToolCalls([]);
    }
  };

  const startNewChat = () => {
    setActiveConversation(null);
    setMessages([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full w-full">
      {/* Conversation Sidebar */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-r border-border bg-card flex flex-col overflow-hidden"
          >
            <div className="p-4 border-b border-border">
              <button
                onClick={startNewChat}
                className="w-full py-2.5 px-4 rounded-lg border border-border text-sm font-medium hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Chat
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConversation(conv.id)}
                  className={`w-full text-left p-3 rounded-lg text-sm transition-colors ${
                    activeConversation === conv.id
                      ? "bg-[var(--bg-hover)] text-foreground"
                      : "text-muted hover:bg-white/5/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 shrink-0" />
                    <span className="truncate">{conv.title}</span>
                    {conv.agent_type === "widget" && (
                      <span className="ml-auto shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400">
                        Visitor
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted/60 mt-1 ml-6">
                    {new Date(conv.updated_at).toLocaleDateString()}
                  </p>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="h-16 px-6 flex items-center gap-4 border-b border-border bg-card/50 backdrop-blur shrink-0">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 rounded-lg hover:bg-white/5 text-muted/60 transition-colors"
          >
            <ChevronLeft
              className={`w-4 h-4 transition-transform ${
                !showSidebar ? "rotate-180" : ""
              }`}
            />
          </button>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
            style={{ backgroundColor: config?.widget_color || "#2563eb" }}
          >
            {(botName || "A")[0].toUpperCase()}
          </div>
          <div>
            <h2 className="font-semibold">{botName}</h2>
            <p className="text-xs text-muted/60">
              Test your chatbot and review conversations
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-dot" />
              <span className="text-xs text-emerald-400 font-medium">Live</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {messages.length === 0 && !streaming && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mb-4"
                style={{ backgroundColor: config?.widget_color || "#2563eb" }}
              >
                {(botName || "A")[0].toUpperCase()}
              </div>
              <h3 className="text-xl font-semibold mb-2">{botName}</h3>
              <p className="text-muted max-w-md mb-4">
                {config?.welcome_message ||
                  "Ask anything about your business knowledge, or try creating a ticket or capturing a lead."}
              </p>
              <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                <SuggestionChip text="What does my business offer?" onClick={(t) => { setInput(t); }} />
                <SuggestionChip text="Show me open tickets" onClick={(t) => { setInput(t); }} />
                <SuggestionChip text="I'd like to talk to sales" onClick={(t) => { setInput(t); }} />
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 ${
                msg.role === "user" ? "justify-end" : ""
              }`}
            >
              {msg.role === "assistant" && (
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 mt-1 text-white font-bold"
                  style={{ backgroundColor: config?.widget_color || "#2563eb" }}
                >
                  {(botName || "A")[0].toUpperCase()}
                </div>
              )}

              <div
                className={`max-w-[75%] ${
                  msg.role === "user"
                    ? "bg-blue/10 border border-blue/20 rounded-2xl rounded-tr-md px-4 py-3"
                    : "bg-surface border border-border rounded-2xl rounded-tl-md px-4 py-3"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="chat-markdown text-sm">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                )}

                {msg.role === "assistant" && msg.actions && (
                  <ActionsPanel actions={msg.actions} />
                )}

                {/* Source Citations */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-muted/60 mb-2">
                      Sources:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {msg.sources.map((src, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-background border border-border text-xs text-muted"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {src.source}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-1">
                  You
                </div>
              )}
            </motion.div>
          ))}

          {/* Live Tool Calls */}
          {(activeToolCalls.length > 0 || completedToolCalls.length > 0) && !streamingContent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-4"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 mt-1 text-white font-bold"
                style={{ backgroundColor: config?.widget_color || "#2563eb" }}
              >
                {(botName || "A")[0].toUpperCase()}
              </div>
              <div className="bg-surface border border-border rounded-2xl rounded-tl-md px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  {completedToolCalls.map((tc, i) => (
                    <ToolCallBadge key={`done-${i}`} tool={tc.tool} status="done" />
                  ))}
                  {activeToolCalls.map((tc, i) => (
                    <ToolCallBadge key={`active-${i}`} tool={tc.tool} status="running" />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Streaming Content */}
          {streaming && streamingContent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-4"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 text-white font-bold"
                style={{ backgroundColor: config?.widget_color || "#2563eb" }}
              >
                {(botName || "A")[0].toUpperCase()}
              </div>
              <div className="max-w-[75%] bg-surface border border-border rounded-2xl rounded-tl-md px-4 py-3">
                {completedToolCalls.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3 pb-3 border-b border-border">
                    {completedToolCalls.map((tc, i) => (
                      <ToolCallBadge key={i} tool={tc.tool} status="done" />
                    ))}
                  </div>
                )}
                <div className="chat-markdown text-sm">
                  <ReactMarkdown>{streamingContent}</ReactMarkdown>
                </div>
              </div>
            </motion.div>
          )}

          {/* Typing Indicator */}
          {loading && !streamingContent && activeToolCalls.length === 0 && completedToolCalls.length === 0 && (
            <div className="flex gap-4">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 text-white font-bold"
                style={{ backgroundColor: config?.widget_color || "#2563eb" }}
              >
                {(botName || "A")[0].toUpperCase()}
              </div>
              <div className="bg-surface border border-border rounded-2xl rounded-tl-md px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-muted/60 typing-dot" />
                  <div className="w-2 h-2 rounded-full bg-muted/60 typing-dot" />
                  <div className="w-2 h-2 rounded-full bg-muted/60 typing-dot" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="px-6 py-4 border-t border-border bg-card/50 backdrop-blur">
          <div className="flex items-end gap-3 max-w-4xl mx-auto">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Message ${botName}...`}
                rows={1}
                className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted/60 text-sm resize-none max-h-32 transition-all"
                style={{ minHeight: "44px" }}
              />
            </div>

            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="p-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SuggestionChip({ text, onClick }: { text: string; onClick: (t: string) => void }) {
  return (
    <button
      onClick={() => onClick(text)}
      className="px-3 py-1.5 rounded-full border border-border text-xs text-muted hover:bg-white/5 hover:text-foreground transition-colors"
    >
      {text}
    </button>
  );
}
