"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { clearAuthToken, getAuthToken } from "../../lib/api";

interface DashboardShellProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function DashboardShell({
  children,
  title,
  subtitle,
  actions,
}: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Check auth: if no token, redirect to login
    const token = getAuthToken();
    if (!token && typeof window !== "undefined") {
      router.push("/login");
    }

    // Default theme is dark
    document.documentElement.classList.add("dark");
  }, [router]);

  function toggleTheme() {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    }
  }

  function handleSignOut() {
    clearAuthToken();
    router.push("/login");
  }

  const navItems = [
    { label: "Monitors", href: "/monitors", icon: Activity },
    { label: "Incidents", href: "/incidents", icon: AlertTriangle },
    { label: "Analytics", href: "/analytics", icon: BarChart3 },
    { label: "Webhooks", href: "/webhooks", icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-warm-bg dark:bg-dark-bg text-warm-ink dark:text-slate-100 flex transition-colors duration-200">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-warm-border dark:border-dark-border bg-white dark:bg-dark-surface p-5 justify-between shrink-0">
        <div className="space-y-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 px-2">
            <div className="w-8 h-8 rounded-full bg-cta/10 border border-cta/30 flex items-center justify-center text-cta">
              <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-heading font-bold text-base tracking-tight text-warm-ink dark:text-white block">
                TraceDeck
              </span>
              <span className="text-[10px] text-warm-muted dark:text-slate-500 font-mono block">
                API Observability
              </span>
            </div>
          </Link>

          {/* Nav Items */}
          <nav className="space-y-1.5 pt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href ||
                (item.href === "/monitors" && pathname.startsWith("/monitors"));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${active
                    ? "bg-warm-bg dark:bg-dark-bg text-warm-ink dark:text-white font-semibold border border-warm-border dark:border-dark-border shadow-sm"
                    : "text-warm-muted hover:text-warm-ink dark:text-slate-400 dark:hover:text-white hover:bg-warm-bg/60 dark:hover:bg-dark-bg/40"
                    }`}
                >
                  <Icon
                    className={`w-4 h-4 ${active ? "text-cta" : "text-warm-muted dark:text-slate-400"
                      }`}
                  />
                  <span>{item.label}</span>
                  {active && <ChevronRight className="w-3.5 h-3.5 ml-auto text-cta opacity-70" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-4 border-t border-warm-border dark:border-dark-border space-y-3">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs text-warm-muted dark:text-slate-500 font-medium">Theme</span>
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg border border-warm-border dark:border-dark-border text-warm-muted hover:text-warm-ink dark:text-slate-400 dark:hover:text-white transition"
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 border-b border-warm-border dark:border-dark-border bg-white/70 dark:bg-dark-surface/70 backdrop-blur sticky top-0 z-40 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 text-warm-ink dark:text-white"
              aria-label="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-heading text-lg sm:text-xl font-bold tracking-tight text-warm-ink dark:text-white">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs text-warm-muted dark:text-slate-400 hidden sm:block">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">{actions}</div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-64 bg-white dark:bg-dark-surface p-5 flex flex-col justify-between shadow-2xl z-10">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-cta/10 border border-cta/30 flex items-center justify-center text-cta">
                    <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <span className="font-heading font-bold text-base text-warm-ink dark:text-white">
                    TraceDeck
                  </span>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1 text-warm-muted"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1.5">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${active
                        ? "bg-warm-bg dark:bg-dark-bg text-warm-ink dark:text-white font-semibold border border-warm-border dark:border-dark-border"
                        : "text-warm-muted hover:text-warm-ink dark:text-slate-400 dark:hover:text-white"
                        }`}
                    >
                      <Icon className={`w-4 h-4 ${active ? "text-cta" : ""}`} />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-warm-border dark:border-dark-border space-y-2">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-500"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

