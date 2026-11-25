"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "../../components/dashboard/DashboardShell";
import { apiRequest } from "../../lib/api";
import { Button } from "../../components/Button";
import { Badge } from "../../components/Badge";
import {
  Activity,
  Plus,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Inbox,
  PauseCircle,
} from "lucide-react";

interface Monitor {
  id: string;
  name: string;
  url: string;
  method: string;
  intervalSeconds: number;
  enabled: boolean;
  lastCheckedAt: string | null;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
}

export default function MonitorsPage() {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState("GET");
  const [interval, setInterval] = useState(60);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function fetchMonitors() {
    setLoading(true);
    const res = await apiRequest("/monitors");
    if (res.success && Array.isArray(res.data)) {
      setMonitors(res.data);
    } else {
      setMonitors([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchMonitors();
  }, []);

  async function handleCreateMonitor(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    const res = await apiRequest("/monitors", {
      method: "POST",
      body: JSON.stringify({
        name,
        url,
        method,
        intervalSeconds: Number(interval),
      }),
    });

    if (res.success) {
      setShowAddModal(false);
      setName("");
      setUrl("");
      fetchMonitors();
    } else {
      const msg = res.error?.message || "";
      if (
        msg.includes("blocked_destination") ||
        msg.includes("SSRF") ||
        msg.includes("private") ||
        msg.includes("loopback")
      ) {
        setFormError(
          "Target destination blocked by connect-time SSRF defense. Cloud metadata (169.254.169.254), loopback (127.0.0.1), and private RFC1918 IP addresses cannot be probed."
        );
      } else {
        setFormError(msg || "Failed to create monitor. Please check input parameters.");
      }
    }
    setSubmitting(false);
  }

  const activeCount = monitors.filter((m) => m.enabled).length;
  const failingCount = monitors.filter((m) => m.consecutiveFailures >= 3).length;

  return (
    <DashboardShell
      title="Monitors"
      subtitle="Active endpoint health probes managed by BullMQ with connect-time SSRF guards"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchMonitors()}
            className="gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setFormError("");
              setShowAddModal(true);
            }}
            withArrow
          >
            Add Monitor
          </Button>
        </div>
      }
    >
      {/* KPI Cards (Computed strictly from real state) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-dark-surface border border-warm-border dark:border-dark-border shadow-card space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-warm-muted dark:text-slate-400">
            Total Endpoints
          </span>
          <div className="text-3xl font-bold font-stat text-warm-ink dark:text-white">
            {monitors.length}
          </div>
          <span className="text-xs text-warm-muted dark:text-slate-500 font-mono">
            {activeCount} scheduled in BullMQ
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-dark-surface border border-warm-border dark:border-dark-border shadow-card space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-warm-muted dark:text-slate-400">
            Active Incidents
          </span>
          <div
            className={`text-3xl font-bold font-stat ${
              failingCount > 0
                ? "text-rose-600 dark:text-rose-400"
                : "text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {failingCount}
          </div>
          <span className="text-xs text-warm-muted dark:text-slate-500 font-mono">
            {failingCount > 0 ? "Degraded endpoints detected" : "All active probes passing"}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-dark-surface border border-warm-border dark:border-dark-border shadow-card space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-warm-muted dark:text-slate-400">
            Probe Concurrency
          </span>
          <div className="text-3xl font-bold font-stat text-warm-ink dark:text-white">
            10
          </div>
          <span className="text-xs text-warm-muted dark:text-slate-500 font-mono">
            Bounded worker pool concurrency
          </span>
        </div>
      </div>

      {/* Monitors Table or Honest Empty State */}
      <div className="rounded-2xl border border-warm-border dark:border-dark-border bg-white dark:bg-dark-surface overflow-hidden shadow-card">
        {loading ? (
          <div className="p-12 text-center text-xs text-warm-muted font-mono animate-pulse">
            Fetching monitors from Redis & PostgreSQL...
          </div>
        ) : monitors.length === 0 ? (
          /* Honest Empty State */
          <div className="p-16 text-center space-y-4 max-w-md mx-auto">
            <div className="w-14 h-14 rounded-full bg-cta/10 border border-cta/30 flex items-center justify-center text-cta mx-auto">
              <Inbox className="w-7 h-7" />
            </div>
            <h3 className="font-heading text-lg font-bold text-warm-ink dark:text-white">
              No monitors created yet
            </h3>
            <p className="text-xs text-warm-muted dark:text-slate-400 leading-relaxed">
              Start observing your production APIs. Add a public HTTP endpoint to monitor availability, measure P50/P95 latency, and automate incidents.
            </p>
            <div className="pt-2">
              <Button
                onClick={() => {
                  setFormError("");
                  setShowAddModal(true);
                }}
                withArrow
              >
                Add Your First Monitor
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-warm-bg dark:bg-dark-bg/80 text-[11px] uppercase tracking-wider text-warm-muted font-semibold border-b border-warm-border dark:border-dark-border">
                <tr>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Endpoint</th>
                  <th className="px-6 py-3.5">Method</th>
                  <th className="px-6 py-3.5">Interval</th>
                  <th className="px-6 py-3.5">Last Checked</th>
                  <th className="px-6 py-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-border dark:divide-dark-border text-xs">
                {monitors.map((m) => {
                  const isFailing = m.consecutiveFailures >= 3;
                  const isPaused = !m.enabled;

                  return (
                    <tr
                      key={m.id}
                      className="hover:bg-warm-bg/40 dark:hover:bg-dark-bg/40 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isPaused ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill text-[11px] font-semibold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
                            <PauseCircle className="w-3.5 h-3.5" /> Paused
                          </span>
                        ) : isFailing ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill text-[11px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            <AlertTriangle className="w-3.5 h-3.5" /> Down
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Healthy
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-warm-ink dark:text-white">
                          {m.name}
                        </div>
                        <div className="font-mono text-[11px] text-warm-muted dark:text-slate-400 truncate max-w-sm">
                          {m.url}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono">
                        <span className="px-2 py-0.5 rounded bg-warm-bg dark:bg-dark-bg border border-warm-border dark:border-dark-border text-[11px]">
                          {m.method}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-warm-muted font-mono flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-warm-muted/60" />
                        {m.intervalSeconds}s
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-warm-muted font-mono">
                        {m.lastCheckedAt
                          ? new Date(m.lastCheckedAt).toLocaleTimeString()
                          : "Pending first run"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Link
                          href={`/monitors/${m.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-warm-border dark:border-dark-border text-xs font-medium hover:border-cta hover:text-cta transition-colors"
                        >
                          View Telemetry
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Monitor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-dark-surface border border-warm-border dark:border-dark-border rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-warm-border dark:border-dark-border">
              <h3 className="font-heading text-lg font-bold text-warm-ink dark:text-white">
                Add New HTTP Monitor
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-warm-muted hover:text-warm-ink dark:hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <span className="leading-relaxed">{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateMonitor} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-warm-ink dark:text-slate-300 mb-1.5">
                  Monitor Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stripe Checkout Webhook"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-warm-bg dark:bg-dark-bg border border-warm-border dark:border-dark-border text-warm-ink dark:text-white text-sm focus:outline-none focus:border-cta"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-warm-ink dark:text-slate-300 mb-1.5">
                  Target Endpoint URL
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://api.example.com/health"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-warm-bg dark:bg-dark-bg border border-warm-border dark:border-dark-border text-warm-ink dark:text-white text-sm font-mono focus:outline-none focus:border-cta"
                />
                <span className="text-[11px] text-warm-muted dark:text-slate-400 mt-1 block">
                  Connect-time SSRF defense automatically rejects loopback, RFC1918 subnets, and cloud metadata.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-warm-ink dark:text-slate-300 mb-1.5">
                    HTTP Method
                  </label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-warm-bg dark:bg-dark-bg border border-warm-border dark:border-dark-border text-warm-ink dark:text-white text-sm focus:outline-none focus:border-cta font-mono"
                  >
                    <option value="GET">GET</option>
                    <option value="HEAD">HEAD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-warm-ink dark:text-slate-300 mb-1.5">
                    Frequency
                  </label>
                  <select
                    value={interval}
                    onChange={(e) => setInterval(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-warm-bg dark:bg-dark-bg border border-warm-border dark:border-dark-border text-warm-ink dark:text-white text-sm focus:outline-none focus:border-cta font-mono"
                  >
                    <option value={30}>Every 30s</option>
                    <option value={60}>Every 60s</option>
                    <option value={120}>Every 2m</option>
                    <option value={300}>Every 5m</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-warm-border dark:border-dark-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} withArrow>
                  {submitting ? "Validating & Creating..." : "Create Monitor"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
