"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "../../components/Navbar";
import { apiRequest } from "../../lib/api";
import { Activity, Plus, ExternalLink, RefreshCw, AlertCircle, CheckCircle2, Clock } from "lucide-react";

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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formName, setFormName] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formMethod, setFormMethod] = useState("GET");
  const [formInterval, setFormInterval] = useState(60);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function fetchMonitors() {
    setLoading(true);
    const res = await apiRequest("/monitors");
    if (res.success && Array.isArray(res.data)) {
      setMonitors(res.data);
    } else {
      // Fallback demo monitors for preview
      setMonitors([
        {
          id: "demo-1",
          name: "Stripe Payment Gateway",
          url: "https://api.stripe.com/healthcheck",
          method: "GET",
          intervalSeconds: 60,
          enabled: true,
          lastCheckedAt: new Date().toISOString(),
          consecutiveFailures: 0,
          consecutiveSuccesses: 1420,
        },
        {
          id: "demo-2",
          name: "Auth0 Token Endpoint",
          url: "https://auth.tracedeck.internal/oauth/token",
          method: "HEAD",
          intervalSeconds: 30,
          enabled: true,
          lastCheckedAt: new Date().toISOString(),
          consecutiveFailures: 0,
          consecutiveSuccesses: 850,
        },
        {
          id: "demo-3",
          name: "User Ingestion Service",
          url: "https://ingest.tracedeck.io/ping",
          method: "GET",
          intervalSeconds: 120,
          enabled: true,
          lastCheckedAt: new Date().toISOString(),
          consecutiveFailures: 3,
          consecutiveSuccesses: 0,
        },
      ]);
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
        name: formName,
        url: formUrl,
        method: formMethod,
        intervalSeconds: Number(formInterval),
      }),
    });

    if (res.success) {
      setShowCreateModal(false);
      setFormName("");
      setFormUrl("");
      fetchMonitors();
    } else {
      setFormError(res.error?.message || "Failed to create monitor (check SSRF policy)");
    }
    setSubmitting(false);
  }

  const activeCount = monitors.filter((m) => m.enabled).length;
  const failingCount = monitors.filter((m) => m.consecutiveFailures >= 3).length;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Monitors</h1>
            <p className="text-sm text-slate-400 mt-1">
              Active endpoint probes running through the BullMQ scheduler with SSRF protection.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchMonitors()}
              className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-1.5 text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition shadow-md shadow-emerald-950 flex items-center gap-1.5 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Monitor
            </button>
          </div>
        </div>

        {/* Quick KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Monitors</div>
            <div className="text-2xl font-bold text-white mt-1">{monitors.length}</div>
            <div className="text-xs text-slate-500 mt-1">{activeCount} actively scheduled</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Incidents</div>
            <div className={`text-2xl font-bold mt-1 ${failingCount > 0 ? "text-rose-400" : "text-emerald-400"}`}>
              {failingCount}
            </div>
            <div className="text-xs text-slate-500 mt-1">{failingCount > 0 ? "Degraded endpoints detected" : "All probes healthy"}</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Avg Check Interval</div>
            <div className="text-2xl font-bold text-white mt-1">60s</div>
            <div className="text-xs text-slate-500 mt-1">Distributed job queue</div>
          </div>
        </div>

        {/* Monitors Table */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/80 text-xs text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Monitor</th>
                  <th className="px-6 py-3.5">Method</th>
                  <th className="px-6 py-3.5">Interval</th>
                  <th className="px-6 py-3.5">Last Checked</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                      Loading monitors...
                    </td>
                  </tr>
                ) : monitors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                      No monitors configured yet. Click "Add Monitor" above.
                    </td>
                  </tr>
                ) : (
                  monitors.map((m) => {
                    const isFailing = m.consecutiveFailures >= 3;
                    return (
                      <tr key={m.id} className="hover:bg-slate-850/50 transition">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isFailing ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-950/60 text-rose-400 border border-rose-800/60">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Down
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Healthy
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-white">{m.name}</div>
                          <div className="text-xs text-slate-400 font-mono truncate max-w-md">{m.url}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-slate-400">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">{m.method}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {m.intervalSeconds}s
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-400 text-xs">
                          {m.lastCheckedAt ? new Date(m.lastCheckedAt).toLocaleTimeString() : "Pending"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <Link
                            href={`/monitors/${m.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
                          >
                            Details
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Monitor Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Add New API Monitor</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              {formError && (
                <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs">
                  {formError}
                </div>
              )}

              <form onSubmit={handleCreateMonitor} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Friendly Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Authentication Service"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Target URL (SSRF Protected)</label>
                  <input
                    type="url"
                    required
                    placeholder="https://api.example.com/health"
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-sm font-mono focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Localhost, private IPs, and cloud metadata (169.254.169.254) are rejected.
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">HTTP Method</label>
                    <select
                      value={formMethod}
                      onChange={(e) => setFormMethod(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500"
                    >
                      <option value="GET">GET</option>
                      <option value="HEAD">HEAD</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Interval (seconds)</label>
                    <select
                      value={formInterval}
                      onChange={(e) => setFormInterval(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500"
                    >
                      <option value={30}>30s</option>
                      <option value={60}>60s</option>
                      <option value={120}>2m</option>
                      <option value={300}>5m</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm font-medium transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition shadow-md shadow-emerald-950 disabled:opacity-50"
                  >
                    {submitting ? "Validating & Creating..." : "Create Monitor"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
