"use client";

import { useEffect, useState } from "react";
import { Navbar } from "../../components/Navbar";
import { apiRequest } from "../../lib/api";
import { BarChart3, Clock, Zap, ShieldAlert, Activity } from "lucide-react";
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
  const [window, setWindow] = useState("24h");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      setLoading(true);
      const res = await apiRequest(`/analytics/overview?window=${window}`);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        // Fallback demo metrics
        const timeSeries = Array.from({ length: 24 }, (_, i) => ({
          timestamp: `${i}:00`,
          avgLatencyMs: Math.floor(40 + Math.random() * 25 + (i === 8 ? 95 : 0)),
          uptimePercentage: i === 8 ? 96.5 : 100,
        }));

        setData({
          window,
          totalChecks: 2880,
          successfulChecks: 2872,
          failedChecks: 8,
          uptimePercentage: 99.72,
          latency: {
            avgMs: 52,
            p50Ms: 44,
            p95Ms: 88,
            p99Ms: 135,
            minMs: 28,
            maxMs: 290,
          },
          monitorsCount: 3,
          activeIncidentsCount: 0,
          timeSeries,
        });
      }
      setLoading(false);
    }
    loadAnalytics();
  }, [window]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header & Window Selector */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Analytics Overview</h1>
            <p className="text-sm text-slate-400 mt-1">
              Cross-monitor uptime performance and tail latency percentiles (P50, P95, P99).
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            {["1h", "24h", "7d", "30d"].map((w) => (
              <button
                key={w}
                onClick={() => setWindow(w)}
                className={`px-3 py-1.5 rounded-md font-medium transition ${
                  window === w
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        {/* Top Metric Cards */}
        {data && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Overall Uptime</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">{data.uptimePercentage}%</div>
              <div className="text-xs text-slate-500 mt-1">{data.successfulChecks} / {data.totalChecks} checks</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Median Latency (P50)</div>
              <div className="text-2xl font-bold text-white mt-1">{data.latency.p50Ms} ms</div>
              <div className="text-xs text-slate-500 mt-1">50th percentile</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Tail Latency (P95)</div>
              <div className="text-2xl font-bold text-cyan-400 mt-1">{data.latency.p95Ms} ms</div>
              <div className="text-xs text-slate-500 mt-1">95th percentile SLA</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Worst Latency (P99)</div>
              <div className="text-2xl font-bold text-indigo-400 mt-1">{data.latency.p99Ms} ms</div>
              <div className="text-xs text-slate-500 mt-1">99th percentile</div>
            </div>
          </div>
        )}

        {/* Latency Distribution Chart */}
        {data && (
          <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                Aggregated Response Time Trend ({window})
              </h3>
              <span className="text-xs text-slate-500">Average response time across all monitors</span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.timeSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="analyticsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
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
                    itemStyle={{ color: "#22d3ee" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="avgLatencyMs"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#analyticsGradient)"
                    name="Avg Latency (ms)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
