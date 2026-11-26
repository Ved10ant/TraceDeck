"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Activity, AlertTriangle, Bell, BarChart3, CheckCircle2, Clock } from "lucide-react";
import { Badge } from "../Badge";

export function TabbedShowcase() {
  const [activeTab, setActiveTab] = useState<"monitoring" | "incidents" | "notifications" | "analytics">(
    "monitoring"
  );
  const prefersReducedMotion = useReducedMotion();

  const tabs = [
    { id: "monitoring", label: "Monitoring", icon: Activity },
    { id: "incidents", label: "Incidents", icon: AlertTriangle },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
  ] as const;

  return (
    <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8 relative">
      <motion.div
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.3, margin: "0px 0px -60px 0px" }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="text-center space-y-4 max-w-2xl mx-auto"
      >
        <Badge variant="section">INTERACTIVE WORKFLOW</Badge>
        <h2 className="font-heading text-3xl sm:text-5xl font-bold tracking-tight text-white">
          Built for every stage of{" "}
          <span className="font-serif italic font-normal text-cta">observability</span>
        </h2>
        <p className="text-sm sm:text-base text-cosmo-muted">
          Switch through live system components to see how TraceDeck moves from detection to resolution.
        </p>

        {/* Cosmoq-style Animated Glass Tab Selector Pills */}
        <div className="inline-flex flex-wrap justify-center p-1.5 rounded-pill cosmo-glass mt-4 gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-pill text-xs font-semibold transition-colors duration-200 ${
                  active ? "text-white" : "text-cosmo-muted hover:text-white"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="activeShowcaseTab"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    className="absolute inset-0 rounded-pill bg-white/15 border border-white/20 shadow-[inset_0_0_8px_rgba(255,255,255,0.1)]"
                  />
                )}
                <Icon className={`w-3.5 h-3.5 relative z-10 ${active ? "text-cta" : ""}`} />
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Rim-lit Glass Showcase Container */}
      <motion.div
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.2, margin: "0px 0px -60px 0px" }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-card cosmo-glass-rim p-6 sm:p-8 space-y-6 min-h-[260px]"
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cta shadow-[0_0_10px_#FF5A1F]" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-white">
              {activeTab.toUpperCase()} MODULE
            </span>
          </div>
          <Badge variant="sample">Sample data</Badge>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            {/* Tab 1: Monitoring */}
            {activeTab === "monitoring" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-black/50 text-cosmo-muted uppercase text-[10px] tracking-wider border-b border-white/10">
                    <tr>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Endpoint Name</th>
                      <th className="p-3.5">Target URL</th>
                      <th className="p-3.5">Method</th>
                      <th className="p-3.5">P95 Latency</th>
                      <th className="p-3.5">Interval</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="p-3.5">
                        <span className="inline-flex items-center gap-1.5 text-emerald-400 font-sans font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Healthy
                        </span>
                      </td>
                      <td className="p-3.5 font-sans font-semibold text-white">Payments Charge API</td>
                      <td className="p-3.5 text-cosmo-muted">https://api.example.com/v1/charges</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-cosmo-silver">
                          GET
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-white font-stat">46 ms</td>
                      <td className="p-3.5 text-cosmo-muted">60s</td>
                    </tr>
                    <tr className="hover:bg-white/5 transition-colors">
                      <td className="p-3.5">
                        <span className="inline-flex items-center gap-1.5 text-rose-400 font-sans font-semibold">
                          <AlertTriangle className="w-3.5 h-3.5" /> Degraded
                        </span>
                      </td>
                      <td className="p-3.5 font-sans font-semibold text-white">Identity OAuth Token</td>
                      <td className="p-3.5 text-cosmo-muted">https://auth.example.com/oauth/token</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-cosmo-silver">
                          HEAD
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-rose-400 font-stat">1,240 ms</td>
                      <td className="p-3.5 text-cosmo-muted">30s</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab 2: Incidents */}
            {activeTab === "incidents" && (
              <div className="p-5 rounded-2xl bg-black/50 border border-white/10 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                        CRITICAL
                      </span>
                      <h4 className="font-heading font-bold text-base text-white">
                        Identity OAuth Token Degraded (HTTP 503)
                      </h4>
                    </div>
                    <p className="text-xs text-cosmo-muted font-mono mt-1.5">
                      Incident auto-opened after 3 consecutive failures. Partial unique index prevents duplicate alerts.
                    </p>
                  </div>
                  <div className="text-xs text-cosmo-muted flex items-center gap-1.5 font-mono">
                    <Clock className="w-3.5 h-3.5 text-cta" /> Opened 4 mins ago
                  </div>
                </div>

                {/* Stepper */}
                <div className="pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-cta/15 border border-cta/40 text-cta font-semibold">
                    1. Investigating
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-cosmo-muted">
                    2. Identified
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-cosmo-muted">
                    3. Monitoring
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-cosmo-muted">
                    4. Resolved
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Notifications */}
            {activeTab === "notifications" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-black/70 font-mono text-xs text-cosmo-silver space-y-2 border border-white/10">
                  <div className="text-cosmo-muted">// Outbound Signed Webhook Request Headers</div>
                  <div className="text-emerald-400">POST https://api.example.com/webhooks/alerts</div>
                  <div className="text-cosmo-muted">Content-Type: application/json</div>
                  <div className="text-cta">X-TraceDeck-Signature: sha256=9f8a3c4b1e5d7a8f...</div>
                  <div className="text-cosmo-muted">X-TraceDeck-Timestamp: 1774351200</div>
                  <div className="pt-2 text-cosmo-silver border-t border-white/5">
                    Payload: {"{"}&quot;event&quot;: &quot;incident.opened&quot;, &quot;severity&quot;: &quot;CRITICAL&quot;, &quot;consecutiveFailures&quot;: 3{"}"}
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between text-xs text-cosmo-muted gap-2">
                  <span>Automatic Exponential Backoff: 5s → 30s → 120s</span>
                  <span className="font-semibold text-emerald-400">Idempotency Upsert Enforced</span>
                </div>
              </div>
            )}

            {/* Tab 4: Analytics */}
            {activeTab === "analytics" && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-black/50 border border-white/10">
                  <span className="text-[11px] uppercase tracking-wider text-cosmo-muted">Uptime (24h)</span>
                  <div className="text-2xl font-bold font-stat text-emerald-400 mt-1">99.85%</div>
                  <span className="text-[11px] text-cosmo-muted font-mono">1,438 / 1,440 checks</span>
                </div>
                <div className="p-4 rounded-xl bg-black/50 border border-white/10">
                  <span className="text-[11px] uppercase tracking-wider text-cosmo-muted">Median (P50)</span>
                  <div className="text-2xl font-bold font-stat text-white mt-1">32 ms</div>
                  <span className="text-[11px] text-cosmo-muted font-mono">Typical latency</span>
                </div>
                <div className="p-4 rounded-xl bg-black/50 border border-white/10">
                  <span className="text-[11px] uppercase tracking-wider text-cosmo-muted">Tail SLA (P95)</span>
                  <div className="text-2xl font-bold font-stat text-cosmo-blue mt-1">68 ms</div>
                  <span className="text-[11px] text-cosmo-muted font-mono">95% faster than</span>
                </div>
                <div className="p-4 rounded-xl bg-black/50 border border-white/10">
                  <span className="text-[11px] uppercase tracking-wider text-cosmo-muted">Outlier (P99)</span>
                  <div className="text-2xl font-bold font-stat text-cosmo-amber mt-1">115 ms</div>
                  <span className="text-[11px] text-cosmo-muted font-mono">99th percentile</span>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
