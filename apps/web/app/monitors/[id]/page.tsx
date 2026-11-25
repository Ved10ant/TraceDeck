"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "../../../components/dashboard/DashboardShell";
import { apiRequest } from "../../../lib/api";
import { Button } from "../../../components/Button";
import { Badge } from "../../../components/Badge";
import {
  ArrowLeft,
  Clock,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Inbox,
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

interface CheckResult {
  id: string;
  outcome: string;
  statusCode: number | null;
  latencyMs: number | null;
  checkedAt: string;
}

export default function MonitorDetailPage() {
  const params = useParams();
  const monitorId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  async function loadData() {
    setLoading(true);
    const res = await apiRequest(`/analytics/monitors/${monitorId}?window=24h`);
    if (res.success && res.data) {
      setData(res.data);
    } else {
      setData(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [monitorId]);

  if (loading) {
    return (
      <DashboardShell title="Monitor Telemetry">
        <div className="p-16 text-center text-xs font-mono text-warm-muted animate-pulse">
          Loading endpoint telemetry & check results...
        </div>
      </DashboardShell>
    );
  }

  if (!data || !data.monitor) {
    return (
      <DashboardShell title="Monitor Not Found">
        <div className="p-16 text-center space-y-4 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-bold text-lg text-warm-ink dark:text-white">
            Endpoint not found
          </h3>
          <p className="text-xs text-warm-muted dark:text-slate-400">
            This monitor does not exist or your organization does not have access to it.
          </p>
          <Button href="/monitors" variant="outline" size="sm">
            Back to Monitors
          </Button>
        </div>
      </DashboardShell>
    );
  }

  const { monitor, summary, recentChecks, activeIncidents } = data;
  const isDown = activeIncidents && activeIncidents.length > 0;

  return (
    <DashboardShell
      title={monitor.name}
      subtitle={monitor.url}
      actions={
        <div className="flex items-center gap-2">
          <Button href="/monitors" variant="outline" size="sm" className="gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Monitors</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => loadData()} className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      }
    >
      {/* Top Details Strip */}
      <div className="p-5 rounded-2xl bg-white dark:bg-dark-surface border border-warm-border dark:border-dark-border shadow-card flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-pill text-xs font-semibold ${
              isDown
                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
            }`}
          >
            {isDown ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            {isDown ? "Active Incident" : "Operational"}
          </span>

          <span className="font-mono text-xs px-2 py-0.5 rounded bg-warm-bg dark:bg-dark-bg border border-warm-border dark:border-dark-border text-warm-ink dark:text-slate-300">
            {monitor.method}
          </span>
          <span className="text-xs text-warm-muted font-mono flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-warm-muted/60" />
            Every {monitor.intervalSeconds}s
          </span>
        </div>

        <div className="text-xs font-mono text-warm-muted dark:text-slate-400">
          Last Check: {monitor.lastCheckedAt ? new Date(monitor.lastCheckedAt).toLocaleString() : "Pending"}
        </div>
      </div>

      {/* Latency & Uptime Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-dark-surface border border-warm-border dark:border-dark-border shadow-card space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-warm-muted">Uptime (24h)</span>
          <div className="text-2xl sm:text-3xl font-bold font-stat text-emerald-600 dark:text-emerald-400">
            {summary.uptimePercentage}%
          </div>
          <span className="text-xs text-warm-muted font-mono">
            {summary.successfulChecks} / {summary.totalChecks} checks
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-dark-surface border border-warm-border dark:border-dark-border shadow-card space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-warm-muted">Median (P50)</span>
          <div className="text-2xl sm:text-3xl font-bold font-stat text-warm-ink dark:text-white">
            {summary.latency.p50Ms} ms
          </div>
          <span className="text-xs text-warm-muted font-mono">50% requests faster</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-dark-surface border border-warm-border dark:border-dark-border shadow-card space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-warm-muted">Tail SLA (P95)</span>
          <div className="text-2xl sm:text-3xl font-bold font-stat text-cyan-600 dark:text-cyan-400">
            {summary.latency.p95Ms} ms
          </div>
          <span className="text-xs text-warm-muted font-mono">95% requests faster</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-dark-surface border border-warm-border dark:border-dark-border shadow-card space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-warm-muted">Outlier (P99)</span>
          <div className="text-2xl sm:text-3xl font-bold font-stat text-indigo-600 dark:text-indigo-400">
            {summary.latency.p99Ms} ms
          </div>
          <span className="text-xs text-warm-muted font-mono">Worst-case tail</span>
        </div>
      </div>

      {/* Latency Area Chart */}
      <div className="p-6 rounded-2xl bg-white dark:bg-dark-surface border border-warm-border dark:border-dark-border shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-sm font-semibold text-warm-ink dark:text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-cta" />
            Response Time Trend (24h)
          </h3>
          <span className="text-xs text-warm-muted font-mono">Values in milliseconds (ms)</span>
        </div>

        {summary.timeSeries.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-xs text-warm-muted font-mono">
            No check results recorded in this time window yet.
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={summary.timeSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="monLatencyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF5A1F" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#FF5A1F" stopOpacity={0.0} />
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
                  itemStyle={{ color: "#FF5A1F" }}
                />
                <Area
                  type="monotone"
                  dataKey="avgLatencyMs"
                  stroke="#FF5A1F"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#monLatencyGrad)"
                  name="Avg Latency (ms)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Recent Check Logs Table */}
      <div className="rounded-2xl border border-warm-border dark:border-dark-border bg-white dark:bg-dark-surface overflow-hidden shadow-card">
        <div className="px-6 py-4 border-b border-warm-border dark:border-dark-border">
          <h3 className="font-heading text-sm font-semibold text-warm-ink dark:text-white">
            Recent Check History
          </h3>
        </div>

        {recentChecks.length === 0 ? (
          <div className="p-8 text-center text-xs text-warm-muted font-mono">
            No check logs recorded yet. Checks run according to the interval schedule.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-warm-bg dark:bg-dark-bg/80 text-[11px] uppercase tracking-wider text-warm-muted font-semibold border-b border-warm-border dark:border-dark-border">
                <tr>
                  <th className="px-6 py-3">Outcome</th>
                  <th className="px-6 py-3">Status Code</th>
                  <th className="px-6 py-3">Latency</th>
                  <th className="px-6 py-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-border dark:divide-dark-border text-xs font-mono">
                {recentChecks.map((check: CheckResult) => (
                  <tr key={check.id} className="hover:bg-warm-bg/40 dark:hover:bg-dark-bg/40">
                    <td className="px-6 py-3 font-sans">
                      {check.outcome === "SUCCESS" ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> SUCCESS
                        </span>
                      ) : (
                        <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" /> {check.outcome}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-warm-ink dark:text-slate-200">
                      {check.statusCode || "—"}
                    </td>
                    <td className="px-6 py-3 text-warm-ink dark:text-slate-200">
                      {check.latencyMs !== null ? `${check.latencyMs} ms` : "—"}
                    </td>
                    <td className="px-6 py-3 text-warm-muted font-sans">
                      {new Date(check.checkedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
