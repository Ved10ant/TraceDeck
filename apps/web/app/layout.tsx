import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TraceDeck — API Observability & Incident Management",
  description: "Monitor API availability, measure latency, and manage incidents from one centralized workspace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
