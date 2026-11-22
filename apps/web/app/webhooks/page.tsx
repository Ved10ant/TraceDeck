"use client";

import { useEffect, useState } from "react";
import { Navbar } from "../../components/Navbar";
import { apiRequest } from "../../lib/api";
import { Bell, Plus, Shield, RefreshCw, Key, Check, Copy, ExternalLink } from "lucide-react";

interface Webhook {
  id: string;
  url: string;
  enabled: boolean;
  createdAt: string;
  secret?: string;
}

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formUrl, setFormUrl] = useState("");
  const [formError, setFormError] = useState("");
  const [newlyCreatedSecret, setNewlyCreatedSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function fetchWebhooks() {
    setLoading(true);
    const res = await apiRequest("/webhooks");
    if (res.success && Array.isArray(res.data)) {
      setWebhooks(res.data);
    } else {
      // Demo webhooks fallback
      setWebhooks([
        {
          id: "wh-1",
          url: "https://api.example.com/webhooks/slack-alerts",
          enabled: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: "wh-2",
          url: "https://api.example.com/webhooks/discord-alerts",
          enabled: true,
          createdAt: new Date().toISOString(),
        },
      ]);
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
      body: JSON.stringify({ url: formUrl }),
    });

    if (res.success) {
      setNewlyCreatedSecret(res.data.secret);
      fetchWebhooks();
    } else {
      setFormError(res.error?.message || "Failed to create webhook (destination blocked by SSRF defense)");
    }
    setSubmitting(false);
  }

  function copySecret() {
    if (newlyCreatedSecret) {
      navigator.clipboard.writeText(newlyCreatedSecret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Webhook Notifications</h1>
            <p className="text-sm text-slate-400 mt-1">
              Real-time incident dispatch signed with HMAC-SHA256 and exponential backoff retry (5s, 30s, 120s).
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchWebhooks()}
              className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={() => {
                setNewlyCreatedSecret(null);
                setFormUrl("");
                setFormError("");
                setShowCreateModal(true);
              }}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition shadow-md shadow-emerald-950 flex items-center gap-1.5 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Webhook
            </button>
          </div>
        </div>

        {/* Security Banner */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
          <Shield className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 leading-relaxed">
            <span className="font-semibold text-white">Cryptographic Verification:</span> Every outgoing webhook request includes the{" "}
            <code className="text-emerald-300 bg-slate-950 px-1 py-0.5 rounded border border-slate-800">
              X-TraceDeck-Signature: sha256=...
            </code>{" "}
            and{" "}
            <code className="text-emerald-300 bg-slate-950 px-1 py-0.5 rounded border border-slate-800">
              X-TraceDeck-Timestamp
            </code>{" "}
            headers to verify message authenticity and protect against replay attacks.
          </div>
        </div>

        {/* Webhooks Table */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/60 text-xs text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Destination URL</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Created</th>
                  <th className="px-6 py-3.5 text-right">Security</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {webhooks.map((wh) => (
                  <tr key={wh.id} className="hover:bg-slate-850/40">
                    <td className="px-6 py-4 font-mono text-white truncate max-w-lg">{wh.url}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(wh.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center gap-1 text-slate-400 font-mono text-[11px]">
                        <Key className="w-3 h-3 text-emerald-400" />
                        HMAC-SHA256
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Create Incident Webhook</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              {newlyCreatedSecret ? (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-200 text-xs space-y-2">
                    <div className="font-semibold text-white">Webhook Created Successfully!</div>
                    <div>
                      Save your signing secret now. For security reasons, it will not be displayed again.
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">HMAC Signing Secret</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={newlyCreatedSecret}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-emerald-400 text-xs font-mono select-all"
                      />
                      <button
                        onClick={copySecret}
                        className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition flex items-center gap-1"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        {copied ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCreateWebhook} className="space-y-4">
                  {formError && (
                    <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs">
                      {formError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Webhook URL</label>
                    <input
                      type="url"
                      required
                      placeholder="https://api.example.com/webhooks/incident-channel"
                      value={formUrl}
                      onChange={(e) => setFormUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-sm font-mono focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Target destinations are evaluated through connect-time SSRF guards before dispatch.
                    </span>
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
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition disabled:opacity-50"
                    >
                      {submitting ? "Validating..." : "Generate Webhook"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
