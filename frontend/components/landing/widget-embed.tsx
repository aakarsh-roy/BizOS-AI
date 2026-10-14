"use client";

import Script from "next/script";

/**
 * Dogfoods the real customer widget on the landing page: the exact snippet
 * businesses paste on their sites, floating bottom-right as on any website.
 * Renders nothing unless a demo chatbot is explicitly configured — never a
 * broken or fake widget. No localhost fallback: on production an unset API
 * URL would point visitors' browsers at themselves.
 */
export function WidgetEmbed() {
  const chatbotId = process.env.NEXT_PUBLIC_DEMO_CHATBOT_ID || "";
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "";

  if (!chatbotId || !apiBase) return null;

  return (
    <Script
      src="/widget.js"
      data-chatbot-id={chatbotId}
      data-api-url={apiBase}
      strategy="lazyOnload"
    />
  );
}
