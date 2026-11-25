"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "../../components/dashboard/DashboardShell";
import { apiRequest } from "../../lib/api";
import { Button } from "../../components/Button";
import {
  BarChart3,
  Clock,
  Zap,
  Activity,
  RefreshCw,
  Inbox,
  ShieldAlert,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function AnalyticsPage() {
  const [windowStr, setWindowStr] = useState("24h");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function loadAnalytics() {
    setLoading(true);
    const res = await apiRequest(`/analytics/overview?window=${windowStr}`);
    if (res.success && res.data) {
      setData(res.data);
    } else {
      setData(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadAnalytics();
  }, [windowStr]);

  const windows = ["1h", "24h", "7d", "30d"];

  return (
    <DashboardShell
      title="Analytics & Telemetry"
      subtitle="Aggregated response time distributions (P50/P95/P99) and uptime SLA calculated from real check records"
      actions={
        <div className="flex items-center gap-2">
          {/* Time Window Selector Pills */}
          <div className="flex items-center gap-1 p-1 rounded-pill bg-white dark:bg-dark-surface border border-warm-border dark:border-dark-border shadow-sm text-xs">
            {windows.map((w) => (
              <button
                key={w}
                onClick={() => setWindowStr(w)}
                className={`px-3 py-1 rounded-pill font-medium transition-all ${
                  windowStr === w
                    ? "bg-warm-ink text-white dark:bg-white dark:text-dark-bg font-semibold shadow-sm"
                    : "text-warm-muted hover:text-warm-ink dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                {w}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => loadAnalytics()}
            className="gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      }
    >
      {loading ? (
        <div className="p-16 text-center text-xs font-mono text-warm-muted animate-pulse">
          Computing percentiles and time-series buckets from PostgreSQL...
        </div>
      ) : !data || data.totalChecks === 0 ? (
        /* Honest Empty State */
        <div className="p-16 rounded-2xl bg-white dark:bg-dark-surface border border-warm-border dark:border-dark-border text-center space-y-4 max-w-md mx-auto shadow-card">
          <div className="w-14 h-14 rounded-full bg-cta/10 border border-cta/30 flex items-center justify-center text-cta mx-auto">
            <BarChart3 className="w-7 h-7" />
          </div>
          <h3 className="font-heading font-bold text-lg text-warm-ink dark:text-white">
            No check data for window ({windowStr})
          </h3>
          <p className="text-xs text-warm-muted dark:text-slate-400 leading-relaxed">
            Analytics are computed exclusively from real persisted check results. Once your monitors execute checks, latency distributions and uptime will render here.
          </p>
          <Button href="/monitors" size="sm" withArrow>
            View Monitors
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-dark-surface border border-warm-border dark:border-dark-border shadow-card space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-warm-muted">Overall Uptime</span>
              <div className="text-2xl sm:text-3xl font-bold font-stat text-emerald-600 dark:text-emerald-400">
                {data.uptimePercentage}%
              </div>
              <span className="text-xs text-warm-muted font-mono">
                {data.successfulChecks} / {data.totalChecks} checks
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-dark-surface border border-warm-border dark:border-dark-border shadow-card space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-warm-muted">Median Latency (P50)</span>
              <div className="text-2xl sm:text-3xl font-bold font-stat text-warm-ink dark:text-white">
                {data.latency.p50Ms} ms
              </div>
              <span className="text-xs text-warm-muted font-mono">50th percentile</span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-dark-surface border border-warm-border dark:border-dark-border shadow-card space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-warm-muted">Tail SLA (P95)</span>
              <div className="text-2xl sm:text-3xl font-bold font-stat text-cyan-600 dark:text-cyan-400">
                {data.latency.p95Ms} ms
              </div>
              <span className="text-xs text-warm-muted font-mono">95% requests faster</span>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-dark-surface border border-warm-border dark:border-dark-border shadow-card space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-warm-muted">Worst-Case (P99)</span>
              <div className="text-2xl sm:text-3xl font-bold font-stat text-indigo-600 dark:text-indigo-400">
                {data.latency.p99Ms} ms
              </div>
              <span className="text-xs text-warm-muted font-mono">99th percentile</span>
            </div>
          </div>

          {/* Aggregated Response Time Trend Area Chart */}
          <div className="p-6 rounded-2xl bg-white dark:bg-dark-surface border border-warm-border dark:border-dark-border shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-sm font-semibold text-warm-ink dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cta" />
                Aggregated Response Time Trend ({windowStr})
              </h3>
              <span className="text-xs text-warm-muted font-mono">Values in milliseconds (ms)</span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.timeSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="analyticsTrendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                  <XAxis dataKey="timestamp" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit="ms" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#12141A",
                      borderColor: "#23262F",
                      borderRadius: "0.75rem",
                      fontSize: "12px",
                      color: "#F8FAFC",
                    }}
                    itemStyle={{ color: "#22d3ee" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="avgLatencyMs"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#analyticsTrendGrad)"
                    name="Avg Latency (ms)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
