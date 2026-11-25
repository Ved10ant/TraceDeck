"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "../../components/dashboard/DashboardShell";
import { apiRequest } from "../../lib/api";
import { Button } from "../../components/Button";
import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Clock,
  ArrowRight,
  ShieldCheck,
  Inbox,
} from "lucide-react";

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
      setIncidents([]);
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
        message: `Status manually transitioned to ${nextStatus}`,
      }),
    });

    if (res.success) {
      fetchIncidents();
    }
    setUpdatingId(null);
  }

  const activeIncidents = incidents.filter((i) => i.status !== "RESOLVED");
  const resolvedIncidents = incidents.filter((i) => i.status === "RESOLVED");

  return (
    <DashboardShell
      title="Incident State Machine"
      subtitle="Automated failure detection (3 consecutive fails) and recovery (2 consecutive passes) with ACID deduplication"
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchIncidents()}
          className="gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      }
    >
      {/* Active Incidents Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-warm-ink dark:text-slate-300 flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                activeIncidents.length > 0 ? "bg-rose-500 animate-ping" : "bg-emerald-500"
              }`}
            />
            Active Incidents ({activeIncidents.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-warm-muted animate-pulse">
            Checking incident states in PostgreSQL...
          </div>
        ) : activeIncidents.length === 0 ? (
          /* Clean Honest Empty State */
          <div className="p-12 rounded-2xl bg-white dark:bg-dark-surface border border-warm-border dark:border-dark-border text-center space-y-3 shadow-card">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-base text-warm-ink dark:text-white">
              All monitored endpoints healthy
            </h3>
            <p className="text-xs text-warm-muted dark:text-slate-400 max-w-sm mx-auto">
              No active incidents. The state machine will automatically open an incident if any monitor records 3 consecutive failures.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {activeIncidents.map((incident) => (
              <div
                key={incident.id}
                className="p-6 rounded-2xl bg-white dark:bg-dark-surface border border-rose-500/30 shadow-card space-y-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                        {incident.severity}
                      </span>
                      <h3 className="font-heading font-bold text-base text-warm-ink dark:text-white">
                        {incident.monitor?.name || `Monitor ${incident.monitorId}`}
                      </h3>
                    </div>
                    <div className="text-xs text-warm-muted font-mono mt-1">
                      {incident.monitor?.url}
                    </div>
                  </div>

                  <div className="text-xs text-warm-muted font-mono flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Started {new Date(incident.startedAt).toLocaleTimeString()}
                  </div>
                </div>

                {/* State Machine Stepper Flow */}
                <div className="pt-4 border-t border-warm-border dark:border-dark-border flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-warm-muted font-medium">State:</span>
                    <span className="px-2.5 py-0.5 rounded-pill bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 font-semibold uppercase text-[11px]">
                      {incident.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {incident.status === "INVESTIGATING" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusTransition(incident.id, "IDENTIFIED")}
                        disabled={updatingId === incident.id}
                        className="gap-1"
                      >
                        Mark Identified <ArrowRight className="w-3 h-3" />
                      </Button>
                    )}
                    {incident.status === "IDENTIFIED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusTransition(incident.id, "MONITORING")}
                        disabled={updatingId === incident.id}
                        className="gap-1"
                      >
                        Mark Monitoring <ArrowRight className="w-3 h-3" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => handleStatusTransition(incident.id, "RESOLVED")}
                      disabled={updatingId === incident.id}
                    >
                      Resolve Incident
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Incident History Timeline */}
      <div className="space-y-4 pt-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-warm-muted dark:text-slate-400">
          Resolved Incident History ({resolvedIncidents.length})
        </h2>

        <div className="rounded-2xl border border-warm-border dark:border-dark-border bg-white dark:bg-dark-surface overflow-hidden shadow-card">
          {resolvedIncidents.length === 0 ? (
            <div className="p-8 text-center text-xs text-warm-muted font-mono">
              No past resolved incidents recorded in database.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-warm-bg dark:bg-dark-bg/80 text-[11px] uppercase tracking-wider text-warm-muted font-semibold border-b border-warm-border dark:border-dark-border">
                  <tr>
                    <th className="px-6 py-3">Endpoint</th>
                    <th className="px-6 py-3">Severity</th>
                    <th className="px-6 py-3">Started</th>
                    <th className="px-6 py-3">Resolved</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-border dark:divide-dark-border text-xs">
                  {resolvedIncidents.map((inc) => (
                    <tr key={inc.id} className="hover:bg-warm-bg/40 dark:hover:bg-dark-bg/40">
                      <td className="px-6 py-3.5 font-medium text-warm-ink dark:text-white">
                        {inc.monitor?.name || inc.monitorId}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="px-2 py-0.5 rounded bg-warm-bg dark:bg-dark-bg border border-warm-border dark:border-dark-border text-[11px]">
                          {inc.severity}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-warm-muted font-mono">
                        {new Date(inc.startedAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-3.5 text-warm-muted font-mono">
                        {inc.resolvedAt ? new Date(inc.resolvedAt).toLocaleString() : "—"}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          RESOLVED
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
