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
  agent_type: string; // "chatbot" (dashboard) | "widget" (visitor) | legacy agent names
  created_at: string;
  updated_at: string;
}

export interface ToolActionResult {
  success?: boolean;
  message?: string;
  error?: string;
  ticket_id?: string;
  lead_id?: string;
  count?: number;
  [key: string]: unknown;
}

export interface ToolAction {
  tool: string;
  result?: ToolActionResult;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  sources: Source[];
  actions?: ToolAction[];
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

export interface EnabledActions {
  lead_capture: boolean;
  ticket_creation: boolean;
}

export interface ChatbotConfig {
  id: string;
  company_id: string;
  public_id: string;
  name: string;
  welcome_message: string;
  tone: "friendly" | "professional" | "concise";
  system_instructions: string;
  enabled_actions: EnabledActions;
  widget_color: string;
  allowed_origins: string[];
  created_at: string;
  updated_at: string;
}

export type ChatbotConfigUpdate = Partial<
  Pick<
    ChatbotConfig,
    | "name"
    | "welcome_message"
    | "tone"
    | "system_instructions"
    | "enabled_actions"
    | "widget_color"
    | "allowed_origins"
  >
>;

export interface AnalyticsOverview {
  total_documents: number;
  total_chats: number;
  total_tickets: number;
  total_leads: number;
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
