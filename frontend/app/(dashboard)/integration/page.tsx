"use client";

import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Copy, Check, Code, Zap, RefreshCw, Layers } from "lucide-react";

export default function IntegrationPage() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const companyId = user?.company_id || "YOUR_COMPANY_ID";
  // Determine backend URL from environment or fallback
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

  // The script snippet
  const snippet = `<!-- BizOS AI Widget -->
<script src="${backendUrl}/widget.js" data-company-id="${companyId}"></script>`;

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
        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-3">Integration</h1>
        <p className="text-muted text-lg">
          Deploy your Unified Omnichannel Agent to your website with a single click.
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
                  <p className="text-sm text-muted">You only need to embed this script once. All future updates are seamless.</p>
                </div>
              </div>
              
              <div className="flex flex-col gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <Layers className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Intelligent Routing</h4>
                  <p className="text-sm text-muted">When a user asks a question, our Orchestrator AI detects their true intent.</p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Seamless Handoff</h4>
                  <p className="text-sm text-muted">The system automatically hands the conversation off to specialized agents.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
