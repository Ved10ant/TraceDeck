"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "../../components/dashboard/DashboardShell";
import { apiRequest } from "../../lib/api";
import { Button } from "../../components/Button";
import {
  Bell,
  Plus,
  Shield,
  Key,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Inbox,
  Clock,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";

interface Webhook {
  id: string;
  url: string;
  enabled: boolean;
  createdAt: string;
  secret?: string;
}

interface Delivery {
  id: string;
  status: string;
  attemptCount: number;
  responseStatus: number | null;
  errorMessage: string | null;
  createdAt: string;
}

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [url, setUrl] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [newlyCreatedSecret, setNewlyCreatedSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Delivery drawer state
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);

  async function fetchWebhooks() {
    setLoading(true);
    const res = await apiRequest("/webhooks");
    if (res.success && Array.isArray(res.data)) {
      setWebhooks(res.data);
    } else {
      setWebhooks([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchWebhooks();
  }, []);

  async function handleCreateWebhook(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    const res = await apiRequest("/webhooks", {
      method: "POST",
      body: JSON.stringify({ url }),
    });

    if (res.success && res.data) {
      setNewlyCreatedSecret(res.data.secret);
      fetchWebhooks();
    } else {
      const msg = res.error?.message || "";
      if (
        msg.includes("blocked_destination") ||
        msg.includes("SSRF") ||
        msg.includes("private") ||
        msg.includes("loopback")
      ) {
        setFormError(
          "Target webhook URL blocked by SSRF defense. Destination cannot target loopback, private subnets, or cloud metadata."
        );
      } else {
        setFormError(msg || "Failed to create webhook. Please check the URL.");
      }
    }
    setSubmitting(false);
  }

  async function openDeliveries(wh: Webhook) {
    setSelectedWebhook(wh);
    setLoadingDeliveries(true);
    const res = await apiRequest(`/webhooks/${wh.id}/deliveries`);
    if (res.success && Array.isArray(res.data)) {
      setDeliveries(res.data);
    } else {
      setDeliveries([]);
    }
    setLoadingDeliveries(false);
  }

  function copySecret() {
    if (newlyCreatedSecret) {
      navigator.clipboard.writeText(newlyCreatedSecret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <DashboardShell
      title="Webhook Notifications"
      subtitle="Real-time incident dispatch signed with HMAC-SHA256 and exponential backoff retry (5s, 30s, 120s)"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchWebhooks()}
            className="gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setNewlyCreatedSecret(null);
              setFormError("");
              setUrl("");
              setShowAddModal(true);
            }}
            withArrow
          >
            Add Webhook
          </Button>
        </div>
      }
    >
      {/* Security Info Banner */}
      <div className="p-5 rounded-2xl bg-white dark:bg-dark-surface border border-warm-border dark:border-dark-border shadow-card flex items-start gap-3.5">
        <Shield className="w-5 h-5 text-cta shrink-0 mt-0.5" />
        <div className="text-xs text-warm-muted dark:text-slate-300 leading-relaxed space-y-1">
          <div className="font-semibold text-warm-ink dark:text-white">
            Cryptographic Verification Standards:
          </div>
          <div>
            Every outgoing webhook request includes <code className="font-mono text-cta bg-warm-bg dark:bg-dark-bg px-1.5 py-0.5 rounded border border-warm-border dark:border-dark-border">X-TraceDeck-Signature: sha256=...</code> and <code className="font-mono text-cta bg-warm-bg dark:bg-dark-bg px-1.5 py-0.5 rounded border border-warm-border dark:border-dark-border">X-TraceDeck-Timestamp</code> headers. Deliveries retry automatically if recipient servers fail.
          </div>
        </div>
      </div>

      {/* Webhooks Table or Honest Empty State */}
      <div className="rounded-2xl border border-warm-border dark:border-dark-border bg-white dark:bg-dark-surface overflow-hidden shadow-card">
        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-warm-muted animate-pulse">
            Loading configured alert webhooks...
          </div>
        ) : webhooks.length === 0 ? (
          /* Honest Empty State */
          <div className="p-16 text-center space-y-4 max-w-md mx-auto">
            <div className="w-14 h-14 rounded-full bg-cta/10 border border-cta/30 flex items-center justify-center text-cta mx-auto">
              <Bell className="w-7 h-7" />
            </div>
            <h3 className="font-heading font-bold text-lg text-warm-ink dark:text-white">
              No alert webhooks configured
            </h3>
            <p className="text-xs text-warm-muted dark:text-slate-400 leading-relaxed">
              Add a webhook URL (Slack, Discord, PagerDuty, or custom receiver) to receive instant HMAC-signed incident notifications.
            </p>
            <Button
              onClick={() => {
                setNewlyCreatedSecret(null);
                setFormError("");
                setUrl("");
                setShowAddModal(true);
              }}
              withArrow
            >
              Add First Webhook
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-warm-bg dark:bg-dark-bg/80 text-[11px] uppercase tracking-wider text-warm-muted font-semibold border-b border-warm-border dark:border-dark-border">
                <tr>
                  <th className="px-6 py-3.5">Destination URL</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Created</th>
                  <th className="px-6 py-3.5 text-right">Delivery Log</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-border dark:divide-dark-border text-xs">
                {webhooks.map((wh) => (
                  <tr
                    key={wh.id}
                    className="hover:bg-warm-bg/40 dark:hover:bg-dark-bg/40 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono font-medium text-warm-ink dark:text-white truncate max-w-md">
                      {wh.url}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-pill text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-warm-muted font-mono">
                      {new Date(wh.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => openDeliveries(wh)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-warm-border dark:border-dark-border text-xs font-medium hover:border-cta hover:text-cta transition-colors"
                      >
                        View Attempts
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Webhook Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-dark-surface border border-warm-border dark:border-dark-border rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-warm-border dark:border-dark-border">
              <h3 className="font-heading text-lg font-bold text-warm-ink dark:text-white">
                Create Incident Alert Webhook
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-warm-muted hover:text-warm-ink dark:hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {newlyCreatedSecret ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-xs space-y-1">
                  <div className="font-semibold">Webhook Provisioned Successfully!</div>
                  <div>
                    Save your signing secret now. For security purposes, this secret is hashed and will not be displayed again.
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-warm-ink dark:text-slate-300 mb-1.5">
                    HMAC Signing Secret (32-byte hex)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={newlyCreatedSecret}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-warm-bg dark:bg-dark-bg border border-warm-border dark:border-dark-border text-cta text-xs font-mono select-all"
                    />
                    <Button size="sm" variant="outline" onClick={copySecret} className="gap-1">
                      {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      <span>{copied ? "Copied" : "Copy"}</span>
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-warm-border dark:border-dark-border">
                  <Button onClick={() => setShowAddModal(false)} size="sm">
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateWebhook} className="space-y-4">
                {formError && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2.5">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                    <span className="leading-relaxed">{formError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-warm-ink dark:text-slate-300 mb-1.5">
                    Destination Webhook URL
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://api.example.com/alerts/webhook"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-warm-bg dark:bg-dark-bg border border-warm-border dark:border-dark-border text-warm-ink dark:text-white text-sm font-mono focus:outline-none focus:border-cta"
                  />
                  <span className="text-[11px] text-warm-muted dark:text-slate-400 mt-1 block">
                    Outbound requests pass through the Undici connect-time socket validator.
                  </span>
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
                    {submitting ? "Validating & Creating..." : "Generate Webhook"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Delivery Attempts Drawer */}
      {selectedWebhook && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-dark-surface border-l border-warm-border dark:border-dark-border p-6 sm:p-8 space-y-6 shadow-2xl flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-warm-border dark:border-dark-border">
                <div>
                  <h3 className="font-heading font-bold text-base text-warm-ink dark:text-white">
                    Delivery Attempt History
                  </h3>
                  <div className="font-mono text-xs text-warm-muted truncate max-w-xs mt-0.5">
                    {selectedWebhook.url}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedWebhook(null)}
                  className="p-1 text-warm-muted hover:text-warm-ink dark:hover:text-white"
                >
                  ✕
                </button>
              </div>

              {loadingDeliveries ? (
                <div className="p-8 text-center text-xs font-mono text-warm-muted animate-pulse">
                  Loading delivery attempt logs...
                </div>
              ) : deliveries.length === 0 ? (
                <div className="p-8 text-center space-y-2 text-warm-muted">
                  <Inbox className="w-8 h-8 mx-auto opacity-40" />
                  <p className="text-xs">No delivery attempts recorded for this webhook yet.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                  {deliveries.map((d) => (
                    <div
                      key={d.id}
                      className="p-3.5 rounded-xl bg-warm-bg dark:bg-dark-bg border border-warm-border dark:border-dark-border font-mono text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-semibold ${d.status === "DELIVERED"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-amber-600 dark:text-amber-400"
                            }`}
                        >
                          {d.status}
                        </span>
                        <span className="text-[11px] text-warm-muted">
                          {new Date(d.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-warm-muted text-[11px]">
                        HTTP Status: {d.responseStatus || "—"} • Attempts: {d.attemptCount}
                      </div>
                      {d.errorMessage && (
                        <div className="text-rose-500 text-[11px]">{d.errorMessage}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button
              variant="outline"
              onClick={() => setSelectedWebhook(null)}
              className="w-full"
            >
              Close Drawer
            </Button>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
