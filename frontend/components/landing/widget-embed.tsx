"use client";

import Script from "next/script";

/**
 * Floating site widget: the exact snippet businesses paste on their sites.
 * Live backend chat when a demo chatbot is configured, otherwise a fully
 * self-contained scripted demo (zero network calls, zero registration).
 * A greeting bubble appears after a few seconds so visitors see the
 * widget's look without clicking. The landing page therefore always shows
 * the floating widget.
 */
export function WidgetEmbed() {
  const chatbotId = process.env.NEXT_PUBLIC_DEMO_CHATBOT_ID || "";
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "";

  if (chatbotId && apiBase) {
    return (
      <Script
        src="/widget.js"
        data-chatbot-id={chatbotId}
        data-api-url={apiBase}
        strategy="lazyOnload"
      />
    );
  }

  return (
    <Script
      src="/widget.js"
      data-demo="scripted"
      data-greeting-delay="5"
      strategy="lazyOnload"
    />
  );
}
