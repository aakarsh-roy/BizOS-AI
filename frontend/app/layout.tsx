import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "BizOS AI — AI-Powered Business Assistant",
  description:
    "BizOS AI is an AI-powered business assistant platform. Use AI employees for customer support, sales, revenue analytics, finance insights, and operations management.",
  keywords: ["AI", "business assistant", "SaaS", "customer support", "sales", "analytics"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
