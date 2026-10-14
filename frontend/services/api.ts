import axios from "axios";
import type { ChatbotConfigUpdate } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: attach auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("bizos_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("bizos_token");
        localStorage.removeItem("bizos_user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth ───────────────────────────────────────────────────────────────────

export const authAPI = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  getMe: () => api.get("/auth/me"),
};

// ─── Company ────────────────────────────────────────────────────────────────

export const companyAPI = {
  create: (data: { name: string; industry: string; website?: string; description?: string }) =>
    api.post("/companies/", data),
  getMine: () => api.get("/companies/me"),
};

// ─── Documents ──────────────────────────────────────────────────────────────

export const documentsAPI = {
  list: () => api.get("/documents/"),
  upload: (formData: FormData) =>
    api.post("/documents/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  delete: (id: string) => api.delete(`/documents/${id}`),
  crawlWebsite: (data: { url: string; max_pages?: number }) =>
    api.post("/knowledge/crawl", data),
};

// ─── Chat ───────────────────────────────────────────────────────────────────

export const chatAPI = {
  send: (data: { message: string; conversation_id?: string }) =>
    api.post("/chat", data),
  sendStream: (data: { message: string; conversation_id?: string }) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("bizos_token") : "";
    return fetch(`${API_BASE_URL}/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
  },
  listConversations: () => api.get("/chat/conversations"),
  getMessages: (conversationId: string) =>
    api.get(`/chat/conversations/${conversationId}/messages`),
};

// ─── Chatbot Configuration ──────────────────────────────────────────────────

export const chatbotAPI = {
  getConfig: () => api.get("/chatbot"),
  updateConfig: (data: ChatbotConfigUpdate) => api.put("/chatbot", data),
};

// ─── Tickets ────────────────────────────────────────────────────────────────

export const ticketsAPI = {
  list: (params?: { status?: string; priority?: string }) =>
    api.get("/tickets/", { params }),
  get: (id: string) => api.get(`/tickets/${id}`),
  create: (data: { title: string; description: string; priority?: string }) =>
    api.post("/tickets/", data),
  update: (id: string, data: Record<string, string>) =>
    api.patch(`/tickets/${id}`, data),
};

// ─── Leads ──────────────────────────────────────────────────────────────────

export const leadsAPI = {
  list: (params?: { search?: string; source?: string }) =>
    api.get("/leads/", { params }),
  get: (id: string) => api.get(`/leads/${id}`),
  create: (data: { name: string; email: string; phone?: string; notes?: string }) =>
    api.post("/leads/", data),
};

// ─── Analytics ──────────────────────────────────────────────────────────────

export const analyticsAPI = {
  overview: () => api.get("/analytics/overview"),
  charts: () => api.get("/analytics/charts"),
};

export default api;
