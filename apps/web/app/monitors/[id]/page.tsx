"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "../../../components/Navbar";
import { apiRequest } from "../../../lib/api";
import { ArrowLeft, Clock, Activity, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
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
  const router = useRouter();
  const monitorId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const res = await apiRequest(`/analytics/monitors/${monitorId}?window=24h`);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        // Fallback demo data
        const dummyTimeSeries = Array.from({ length: 24 }, (_, i) => ({
          timestamp: `${i}:00`,
          avgLatencyMs: Math.floor(45 + Math.random() * 35 + (i === 14 ? 120 : 0)),
          uptimePercentage: i === 14 ? 92 : 100,
        }));

        setData({
          monitor: {
            id: monitorId,
            name: "Production Gateway API",
            url: "https://api.tracedeck.internal/v1/health",
            method: "GET",
            intervalSeconds: 60,
            enabled: true,
            lastCheckedAt: new Date().toISOString(),
          },
          summary: {
            window: "24h",
            totalChecks: 1440,
            successfulChecks: 1435,
            failedChecks: 5,
            uptimePercentage: 99.65,
            latency: {
              avgMs: 58,
              p50Ms: 48,
              p95Ms: 92,
              p99Ms: 145,
              minMs: 32,
              maxMs: 310,
            },
            timeSeries: dummyTimeSeries,
          },
          recentChecks: [
            { id: "c-1", outcome: "SUCCESS", statusCode: 200, latencyMs: 46, checkedAt: new Date().toISOString() },
            { id: "c-2", outcome: "SUCCESS", statusCode: 200, latencyMs: 52, checkedAt: new Date(Date.now() - 60000).toISOString() },
            { id: "c-3", outcome: "SUCCESS", statusCode: 200, latencyMs: 49, checkedAt: new Date(Date.now() - 120000).toISOString() },
            { id: "c-4", outcome: "FAILURE", statusCode: 503, latencyMs: 240, checkedAt: new Date(Date.now() - 180000).toISOString() },
            { id: "c-5", outcome: "SUCCESS", statusCode: 200, latencyMs: 55, checkedAt: new Date(Date.now() - 240000).toISOString() },
          ],
          activeIncidents: [],
        });
      }
      setLoading(false);
    }
    loadData();
  }, [monitorId]);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
          Loading monitor telemetry...
        </div>
      </div>
    );
  }

  const { monitor, summary, recentChecks, activeIncidents } = data;
  const isDown = activeIncidents && activeIncidents.length > 0;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation Bar */}
        <div>
          <Link
            href="/monitors"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Monitors
          </Link>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-white">{monitor.name}</h1>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    isDown
                      ? "bg-rose-950/60 text-rose-400 border border-rose-800/60"
                      : "bg-emerald-950/60 text-emerald-400 border border-emerald-800/60"
                  }`}
                >
                  {isDown ? "Active Incident" : "Operational"}
                </span>
              </div>
              <div className="text-xs text-slate-400 font-mono mt-1 flex items-center gap-3">
                <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                  {monitor.method}
                </span>
                <span>{monitor.url}</span>
                <span>• Check every {monitor.intervalSeconds}s</span>
              </div>
            </div>
          </div>
        </div>

        {/* Latency & Uptime Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Uptime (24h)</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{summary.uptimePercentage}%</div>
            <div className="text-xs text-slate-500 mt-1">
              {summary.successfulChecks} / {summary.totalChecks} checks
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Median Latency (P50)</div>
            <div className="text-2xl font-bold text-white mt-1">{summary.latency.p50Ms} ms</div>
            <div className="text-xs text-slate-500 mt-1">Typical response time</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">95th Percentile (P95)</div>
            <div className="text-2xl font-bold text-cyan-400 mt-1">{summary.latency.p95Ms} ms</div>
            <div className="text-xs text-slate-500 mt-1">95% faster than this</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">99th Percentile (P99)</div>
            <div className="text-2xl font-bold text-indigo-400 mt-1">{summary.latency.p99Ms} ms</div>
            <div className="text-xs text-slate-500 mt-1">Worst-case tail latency</div>
          </div>
        </div>

        {/* Interactive Latency Area Chart */}
        <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Response Time & Latency Trends (24h)
            </h3>
            <span className="text-xs text-slate-500">Values in milliseconds (ms)</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={summary.timeSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="timestamp" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit="ms" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "0.5rem",
                    fontSize: "12px",
                  }}
                  itemStyle={{ color: "#34d399" }}
                />
                <Area
                  type="monotone"
                  dataKey="avgLatencyMs"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#latencyGradient)"
                  name="Avg Latency"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Check Logs Table */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/80">
            <h3 className="text-sm font-semibold text-white">Recent Execution History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/60 text-xs text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3">Outcome</th>
                  <th className="px-6 py-3">Status Code</th>
                  <th className="px-6 py-3">Latency</th>
                  <th className="px-6 py-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs font-mono">
                {recentChecks.map((check: CheckResult) => (
                  <tr key={check.id} className="hover:bg-slate-850/40">
                    <td className="px-6 py-3 font-sans">
                      {check.outcome === "SUCCESS" ? (
                        <span className="text-emerald-400 flex items-center gap-1 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          SUCCESS
                        </span>
                      ) : (
                        <span className="text-rose-400 flex items-center gap-1 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {check.outcome}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-slate-300">{check.statusCode || "—"}</td>
                    <td className="px-6 py-3 text-slate-300">
                      {check.latencyMs !== null ? `${check.latencyMs} ms` : "—"}
                    </td>
                    <td className="px-6 py-3 text-slate-500 font-sans">
                      {new Date(check.checkedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
