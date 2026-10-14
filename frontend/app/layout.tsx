import type { Metadata } from "next";
import { Inter, Space_Grotesk, Fraunces } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const grotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif-display",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "BizOS AI — AI Chatbot for Your Website",
  description:
    "BizOS AI lets any business deploy an AI chatbot trained on its own documents and website. Capture leads, file support tickets, and answer every visitor — with a one-line embed.",
  keywords: ["AI chatbot", "website chatbot", "RAG", "lead capture", "customer support", "SaaS"],
  openGraph: {
    title: "BizOS AI — AI Chatbot for Your Website",
    description:
      "Train an AI chatbot on your business content and embed it on any website with one snippet.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BizOS AI — AI Chatbot for Your Website",
    description:
      "Train an AI chatbot on your business content and embed it on any website with one snippet.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${grotesk.variable} ${fraunces.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
