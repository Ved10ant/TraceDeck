"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, AlertTriangle, BarChart3, Bell, ShieldCheck, LogOut } from "lucide-react";
import { clearAuthToken } from "../lib/api";

export function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { label: "Monitors", href: "/monitors", icon: Activity },
    { label: "Incidents", href: "/incidents", icon: AlertTriangle },
    { label: "Analytics", href: "/analytics", icon: BarChart3 },
    { label: "Webhooks", href: "/webhooks", icon: Bell },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/monitors" className="flex items-center gap-2.5 font-bold text-white text-lg tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span>TraceDeck</span>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition ${
                    active
                      ? "bg-slate-800/80 text-white"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? "text-emerald-400" : ""}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Status & User */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-950/50 border border-emerald-800/60 text-xs font-medium text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            System Operational
          </div>

          <Link
            href="/login"
            onClick={() => clearAuthToken()}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 px-2.5 py-1.5 rounded hover:bg-slate-900 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </Link>
        </div>
      </div>
    </header>
  );
}
