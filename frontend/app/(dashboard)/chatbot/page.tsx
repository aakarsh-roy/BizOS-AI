"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { chatbotAPI } from "@/services/api";
import { apiErrorMessage } from "@/lib/utils";
import type { ChatbotConfig } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChatbotPreview } from "@/components/studio/chatbot-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Save, Check, Copy, Bot } from "lucide-react";

const TONES = [
  { value: "friendly", label: "Friendly" },
  { value: "professional", label: "Professional" },
  { value: "concise", label: "Concise" },
];

export default function ChatbotPage() {
  const [config, setConfig] = useState<ChatbotConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [welcome, setWelcome] = useState("");
  const [tone, setTone] = useState("friendly");
  const [instructions, setInstructions] = useState("");
  const [leadCapture, setLeadCapture] = useState(true);
  const [ticketCreation, setTicketCreation] = useState(true);
  const [color, setColor] = useState("#2563eb");
  const [origins, setOrigins] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await chatbotAPI.getConfig();
        setConfig(data);
        setName(data.name);
        setWelcome(data.welcome_message);
        setTone(data.tone);
        setInstructions(data.system_instructions);
        setLeadCapture(data.enabled_actions.lead_capture);
        setTicketCreation(data.enabled_actions.ticket_creation);
        setColor(data.widget_color);
        setOrigins((data.allowed_origins || []).join("\n"));
      } catch (err) {
        setError("Failed to load chatbot configuration.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

const snippet = config
? `<!-- BizOS AI Widget -->\n<script\n  src="${process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "https://YOUR-BIZOS-DOMAIN")}/widget.js"\n  data-chatbot-id="${config.public_id}"\n  data-api-url="${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}"\n  async\n></script>`
    : "";

  const copySnippet = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!name.trim() || !welcome.trim()) {
      setError("Name and welcome message are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const { data } = await chatbotAPI.updateConfig({
        name: name.trim(),
        welcome_message: welcome.trim(),
        tone: tone as "friendly" | "professional" | "concise",
        system_instructions: instructions,
        enabled_actions: { lead_capture: leadCapture, ticket_creation: ticketCreation },
        widget_color: color,
        allowed_origins: origins
          .split("\n")
          .map((o) => o.trim())
          .filter(Boolean),
      });
      setConfig(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to save configuration."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-3">My Chatbot</h1>
        <p className="text-muted text-lg">
          Configure how your chatbot looks, sounds, and what it can do.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-8 items-start">
        <div className="space-y-8 min-w-0">

      {/* Identity */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader>
            <CardTitle>Identity & Greeting</CardTitle>
            <CardDescription>Shown to visitors in the chat widget.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label htmlFor="chatbot-name" className="text-sm font-medium text-muted">Chatbot name</label>
                <Input id="chatbot-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={50} placeholder="Acme Assistant" />
              </div>
              <div className="space-y-2">
                <label htmlFor="chatbot-color" className="text-sm font-medium text-muted">Accent color</label>
                <div className="flex items-center gap-3">
                  <input
                    id="chatbot-color"
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-12 w-14 rounded-[14px] border border-border bg-surface cursor-pointer p-1"
                  />
                  <Input value={color} onChange={(e) => setColor(e.target.value)} className="font-mono" aria-label="Accent color hex value" />
                  <div className="w-10 h-10 rounded-full shrink-0" style={{ backgroundColor: color }} />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="chatbot-welcome" className="text-sm font-medium text-muted">Welcome message</label>
              <textarea
                id="chatbot-welcome"
                value={welcome}
                onChange={(e) => setWelcome(e.target.value)}
                maxLength={500}
                rows={2}
                className="flex w-full rounded-[14px] border border-border bg-surface px-4 py-3 text-sm ring-offset-background placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary resize-none"
                placeholder="Hi! I'm here to help. How can I assist you today?"
              />
            </div>

            <div className="space-y-2">
              <span id="chatbot-tone-label" className="text-sm font-medium text-muted">Tone</span>
              <div className="flex gap-2" role="group" aria-labelledby="chatbot-tone-label">
                {TONES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTone(t.value)}
                    aria-pressed={tone === t.value}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      tone === t.value
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border text-muted hover:bg-white/5"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Behavior */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader>
            <CardTitle>Behavior & Actions</CardTitle>
            <CardDescription>Business-specific instructions and enabled capabilities.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="chatbot-instructions" className="text-sm font-medium text-muted">
                Business instructions <span className="text-muted/50">(optional)</span>
              </label>
              <textarea
                id="chatbot-instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                maxLength={2000}
                rows={4}
                className="flex w-full rounded-[14px] border border-border bg-surface px-4 py-3 text-sm ring-offset-background placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary resize-none"
                placeholder="e.g. We offer three plans: Starter, Pro, and Enterprise. Our office hours are 9am–5pm CET..."
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-muted">Enabled actions</label>
              <label className="flex items-center gap-3 p-3 rounded-lg border border-border bg-surface cursor-pointer hover:bg-white/5 transition-colors">
                <input
                  type="checkbox"
                  checked={leadCapture}
                  onChange={(e) => setLeadCapture(e.target.checked)}
                  className="w-4 h-4 accent-[var(--primary,#2563eb)]"
                />
                <div>
                  <p className="text-sm font-medium text-foreground">Lead capture</p>
                  <p className="text-xs text-muted">Save contact details of interested visitors.</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg border border-border bg-surface cursor-pointer hover:bg-white/5 transition-colors">
                <input
                  type="checkbox"
                  checked={ticketCreation}
                  onChange={(e) => setTicketCreation(e.target.checked)}
                  className="w-4 h-4 accent-[var(--primary,#2563eb)]"
                />
                <div>
                  <p className="text-sm font-medium text-foreground">Support ticket creation</p>
                  <p className="text-xs text-muted">Let the chatbot create tickets for reported issues.</p>
                </div>
              </label>
            </div>

            <div className="space-y-2">
              <label htmlFor="chatbot-origins" className="text-sm font-medium text-muted">
                Allowed website origins <span className="text-muted/50">(optional, one per line — blank = any site)</span>
              </label>
              <textarea
                id="chatbot-origins"
                value={origins}
                onChange={(e) => setOrigins(e.target.value)}
                rows={2}
                className="flex w-full rounded-[14px] border border-border bg-surface px-4 py-3 text-sm font-mono ring-offset-background placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary resize-none"
                placeholder="https://www.your-site.com"
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <div className="flex items-center gap-3">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : saved ? (
                  <Check className="w-4 h-4 mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {saved ? "Saved" : "Save changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Embed snippet */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle>Install on your website</CardTitle>
                <CardDescription>Paste this snippet before the closing {"</body>"} tag.</CardDescription>
              </div>
              <div className="ml-auto">
                <Button variant="secondary" size="sm" onClick={copySnippet} className="gap-2">
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="text-sm overflow-x-auto text-foreground font-mono bg-surface border border-border rounded-xl p-5">
              <code>{snippet}</code>
            </pre>
          </CardContent>
        </Card>
      </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="xl:sticky xl:top-24"
        >
          <ChatbotPreview
            name={name}
            welcome={welcome}
            color={color}
            tone={tone}
            leadCapture={leadCapture}
            ticketCreation={ticketCreation}
          />
        </motion.div>
      </div>
    </div>
  );
}
