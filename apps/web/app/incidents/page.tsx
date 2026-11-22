"use client";

import { useEffect, useState } from "react";
import { Navbar } from "../../components/Navbar";
import { apiRequest } from "../../lib/api";
import { AlertTriangle, CheckCircle, RefreshCw, Clock, ArrowRight } from "lucide-react";

interface Incident {
  id: string;
  monitorId: string;
  status: "INVESTIGATING" | "IDENTIFIED" | "MONITORING" | "RESOLVED";
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  startedAt: string;
  resolvedAt: string | null;
  monitor?: {
    name: string;
    url: string;
  };
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function fetchIncidents() {
    setLoading(true);
    const res = await apiRequest("/incidents");
    if (res.success && Array.isArray(res.data)) {
      setIncidents(res.data);
    } else {
      // Demo incidents fallback
      setIncidents([
        {
          id: "inc-101",
          monitorId: "mon-1",
          status: "INVESTIGATING",
          severity: "CRITICAL",
          startedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          resolvedAt: null,
          monitor: {
            name: "Payment Processing API",
            url: "https://payments.tracedeck.internal/v1/charge",
          },
        },
        {
          id: "inc-102",
          monitorId: "mon-2",
          status: "RESOLVED",
          severity: "HIGH",
          startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          resolvedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          monitor: {
            name: "Customer Notification Service",
            url: "https://notify.tracedeck.internal/dispatch",
          },
        },
      ]);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchIncidents();
  }, []);

  async function handleStatusTransition(id: string, nextStatus: string) {
    setUpdatingId(id);
    const res = await apiRequest(`/incidents/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({
        status: nextStatus,
        message: `Status updated to ${nextStatus} via TraceDeck dashboard`,
      }),
    });

    if (res.success) {
      fetchIncidents();
    } else {
      // update state locally for demo
      setIncidents((prev) =>
        prev.map((inc) => (inc.id === id ? { ...inc, status: nextStatus as any } : inc))
      );
    }
    setUpdatingId(null);
  }

  const activeIncidents = incidents.filter((i) => i.status !== "RESOLVED");
  const resolvedIncidents = incidents.filter((i) => i.status === "RESOLVED");

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Incident State Machine</h1>
            <p className="text-sm text-slate-400 mt-1">
              Automated failure detection (3 consecutive fails) and recovery (2 consecutive successes) with deduplication.
            </p>
          </div>
          <button
            onClick={() => fetchIncidents()}
            className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Active Incidents Banner */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            Active Incidents ({activeIncidents.length})
          </h2>

          {activeIncidents.length === 0 ? (
            <div className="p-8 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-slate-500 text-sm">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
              All monitored services operational. No active incidents.
            </div>
          ) : (
            <div className="grid gap-4">
              {activeIncidents.map((incident) => (
                <div
                  key={incident.id}
                  className="p-5 rounded-xl bg-slate-900/60 border border-rose-900/40 space-y-4 shadow-lg shadow-rose-950/20"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-950 border border-rose-800 text-rose-300">
                          {incident.severity}
                        </span>
                        <h3 className="text-base font-bold text-white">
                          {incident.monitor?.name || `Monitor ${incident.monitorId}`}
                        </h3>
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-1">
                        {incident.monitor?.url}
                      </div>
                    </div>

                    <div className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      Opened {new Date(incident.startedAt).toLocaleTimeString()}
                    </div>
                  </div>

                  {/* State Machine Transition Flow */}
                  <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-400 font-medium">Current Status:</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-950/70 border border-amber-800 text-amber-300 font-semibold uppercase">
                        {incident.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {incident.status === "INVESTIGATING" && (
                        <button
                          onClick={() => handleStatusTransition(incident.id, "IDENTIFIED")}
                          disabled={updatingId === incident.id}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition flex items-center gap-1"
                        >
                          Mark Identified <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                      {incident.status === "IDENTIFIED" && (
                        <button
                          onClick={() => handleStatusTransition(incident.id, "MONITORING")}
                          disabled={updatingId === incident.id}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition flex items-center gap-1"
                        >
                          Mark Monitoring <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={() => handleStatusTransition(incident.id, "RESOLVED")}
                        disabled={updatingId === incident.id}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white transition shadow-sm shadow-emerald-950"
                      >
                        Resolve Incident
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resolved History */}
        <div className="space-y-4 pt-6">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
            Past Incident Timeline ({resolvedIncidents.length})
          </h2>

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/60 text-xs text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-3">Monitor</th>
                    <th className="px-6 py-3">Severity</th>
                    <th className="px-6 py-3">Started</th>
                    <th className="px-6 py-3">Resolved</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {resolvedIncidents.map((inc) => (
                    <tr key={inc.id} className="hover:bg-slate-850/40">
                      <td className="px-6 py-3.5 font-medium text-white">
                        {inc.monitor?.name || inc.monitorId}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {inc.severity}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-slate-400">
                        {new Date(inc.startedAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-3.5 text-slate-400">
                        {inc.resolvedAt ? new Date(inc.resolvedAt).toLocaleString() : "—"}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="text-emerald-400 font-semibold">RESOLVED</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
