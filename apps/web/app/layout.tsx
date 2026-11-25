import type { Metadata } from "next";
import {
  Instrument_Sans,
  Instrument_Serif,
  Inter,
  JetBrains_Mono,
  Space_Grotesk,
} from "next/font/google";
import "./globals.css";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const heading = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["600", "700"],
  display: "swap",
});

const serif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const stat = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-stat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TraceDeck — Developer-First API Observability & Incident Management",
  description:
    "Monitor API availability, measure tail latency (P50/P95/P99), prevent SSRF attacks at connect-time, and manage incidents without duplicate noise.",
  keywords: [
    "API monitoring",
    "Observability",
    "Incident management",
    "SSRF defense",
    "Uptime monitor",
    "BullMQ",
    "Developer tools",
  ],
  authors: [{ name: "Vedant Dighe" }],
  openGraph: {
    title: "TraceDeck — Monitor. Detect. Investigate. Resolve.",
    description:
      "Developer-first API observability and incident management SaaS with connect-time SSRF defense and deduplicated state machines.",
    type: "website",
    url: "https://github.com/Ved10ant/TraceDeck",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${heading.variable} ${serif.variable} ${mono.variable} ${stat.variable}`}
    >
      <body className="font-sans antialiased selection:bg-cta/20 selection:text-cta">
        {children}
      </body>
    </html>
  );
}
