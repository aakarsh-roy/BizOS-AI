// BizOS AI — TypeScript type definitions

export interface User {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "member";
  company_id: string | null;
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  website?: string;
  description?: string;
  owner_id: string;
  created_at: string;
}

export interface Document {
  id: string;
  filename: string;
  file_url: string;
  file_type: string;
  status: "pending" | "processing" | "completed" | "failed";
  chunk_count: number;
  uploaded_by: string;
  uploaded_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  agent_type: AgentType;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  sources: Source[];
  actions?: any[];
  created_at: string;
}

export interface Source {
  source: string;
  relevance: number;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  company_id: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  notes?: string;
  source: string;
  company_id: string;
  created_at: string;
}

export type AgentType = "support" | "sales" | "revenue" | "finance" | "operations";

export interface AnalyticsOverview {
  total_documents: number;
  total_chats: number;
  total_tickets: number;
  total_leads: number;
  active_agents: number;
  open_tickets: number;
  in_progress_tickets: number;
  resolved_tickets: number;
}

export interface ChartData {
  agent_usage: Record<string, number>;
  daily_chats: { date: string; chats: number }[];
  tickets_by_priority: Record<string, number>;
  daily_leads: { date: string; leads: number }[];
}

export const AGENT_CONFIG: Record<
  AgentType,
  { name: string; description: string; icon: string; color: string; gradient: string }
> = {
  support: {
    name: "Customer Support",
    description: "Answer FAQs, search policies, and manage tickets",
    icon: "🎧",
    color: "from-blue-500 to-cyan-500",
    gradient: "bg-gradient-to-br from-blue-500/10 to-cyan-500/10",
  },
  sales: {
    name: "Sales Agent",
    description: "Product recommendations and lead capture",
    icon: "💼",
    color: "from-emerald-500 to-teal-500",
    gradient: "bg-gradient-to-br from-emerald-500/10 to-teal-500/10",
  },
  revenue: {
    name: "Revenue Analytics",
    description: "Analyze revenue data and growth trends",
    icon: "📊",
    color: "from-violet-500 to-purple-500",
    gradient: "bg-gradient-to-br from-violet-500/10 to-purple-500/10",
  },
  finance: {
    name: "Finance Insights",
    description: "Expense analysis and budget management",
    icon: "💰",
    color: "from-amber-500 to-orange-500",
    gradient: "bg-gradient-to-br from-amber-500/10 to-orange-500/10",
  },
  operations: {
    name: "Operations Manager",
    description: "Executive summaries and cross-functional insights",
    icon: "🏢",
    color: "from-rose-500 to-pink-500",
    gradient: "bg-gradient-to-br from-rose-500/10 to-pink-500/10",
  },
};
