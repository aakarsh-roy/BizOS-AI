"use client";

import { useEffect, useState } from "react";
import { chatbotAPI } from "@/services/api";
import { INSTALL_SEEN_KEY } from "@/components/dashboard/getting-started";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Copy, Check, Code, Zap, BookOpen, Ticket } from "lucide-react";

const PLATFORMS = [
  {
    id: "html",
    label: "HTML",
    steps: [
      "Copy the snippet above.",
      "Paste it just before the closing </body> tag on every page (or in your shared footer template).",
      "Deploy your site and click the chat launcher to test.",
    ],
  },
  {
    id: "wordpress",
    label: "WordPress",
    steps: [
      "Copy the snippet above.",
      "Go to Appearance → Theme File Editor → footer.php, and paste it just before </body> — or use the “Insert Headers and Footers” plugin and paste it into the footer scripts box.",
      "Update the file and visit your site to test the launcher.",
    ],
  },
  {
    id: "webflow",
    label: "Webflow",
    steps: [
      "Copy the snippet above.",
      "Open Site settings → Custom Code, paste it into the Footer Code box, and save.",
      "Publish your site and test the launcher.",
    ],
  },
  {
    id: "shopify",
    label: "Shopify",
    steps: [
      "Copy the snippet above.",
      "Go to Online Store → Themes → ⋯ → Edit code, open layout/theme.liquid, and paste it just before </body>.",
      "Save and open your storefront to test the launcher.",
    ],
  },
];

export default function IntegrationPage() {
  const [snippet, setSnippet] = useState("");
  const [copied, setCopied] = useState(false);
  const [platform, setPlatform] = useState("html");

  useEffect(() => {
    let cancelled = false;
    // Record that the owner has seen the install snippet (getting-started checklist)
    try {
      localStorage.setItem(INSTALL_SEEN_KEY, "1");
    } catch {
      // storage unavailable
    }
    (async () => {
      const origin =
        process.env.NEXT_PUBLIC_SITE_URL ||
        (typeof window !== "undefined" ? window.location.origin : "");
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      let publicId = "";
      try {
        const { data } = await chatbotAPI.getConfig();
        publicId = data.public_id;
      } catch (err) {
        console.error("Failed to load chatbot config:", err);
      }
      if (!cancelled) {
        setSnippet(`<!-- BizOS AI Widget -->
<script
  src="${origin || "https://YOUR-BIZOS-DOMAIN"}/widget.js"
  data-chatbot-id="${publicId || "PUBLIC_CHATBOT_ID"}"
  data-api-url="${apiBase}"
  async
></script>`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-3">Install</h1>
        <p className="text-muted text-lg">
          Add your AI chatbot to any website with a single copy-paste snippet.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                <Code className="w-5 h-5 text-white" />
              </div>
              <CardTitle className="text-2xl">Embed Website Widget</CardTitle>
            </div>
            <CardDescription className="text-base text-muted/80">
              Copy the snippet below and paste it just before the closing <code className="text-primary font-mono bg-primary/10 px-1.5 py-0.5 rounded">{"</body>"}</code> tag on your website.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
              <div className="relative bg-surface border border-border rounded-xl p-5 mb-8">
                <pre className="text-sm overflow-x-auto text-foreground font-mono">
                  <code>{snippet}</code>
                </pre>
                <div className="absolute top-4 right-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={copyToClipboard}
                    className="gap-2 h-8 bg-card border-border hover:bg-white/10"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-border">
              <div className="flex flex-col gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Single Installation</h4>
                  <p className="text-sm text-muted">Embed the snippet once. Configuration updates apply automatically.</p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Grounded Answers</h4>
                  <p className="text-sm text-muted">The chatbot answers from your uploaded documents and website content.</p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Ticket className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Leads & Tickets</h4>
                  <p className="text-sm text-muted">Captures leads and creates support tickets when you enable those actions.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Platform guides</CardTitle>
            <CardDescription>Where to paste the snippet on popular platforms.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-6" role="tablist" aria-label="Platforms">
              {PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  role="tab"
                  aria-selected={platform === p.id}
                  onClick={() => setPlatform(p.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    platform === p.id
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted hover:bg-white/5"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <ol className="space-y-3">
              {PLATFORMS.find((p) => p.id === platform)?.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="w-6 h-6 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-muted leading-relaxed pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
