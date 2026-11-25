"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ShieldCheck, Database, BarChart3, BellRing } from "lucide-react";
import { Badge } from "../Badge";

export function DifferentiatorsSection() {
  const prefersReducedMotion = useReducedMotion();

  const items = [
    {
      title: "Reliable by design",
      description:
        "Health checks are strictly decoupled from the synchronous HTTP request cycle. BullMQ workers run background probes with deterministic job IDs to guarantee crash recovery without duplicate check storms.",
      icon: Database,
      tileBg: "bg-cosmo-blue/15 text-blue-400 border-cosmo-blue/30",
      visual: (
        <div className="mt-4 p-3 rounded-xl bg-black/50 border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono text-cosmo-muted">
            <span>QUEUE: bullmq:monitor-checks</span>
            <span className="text-cosmo-blue">IDEMPOTENT</span>
          </div>
          <div className="space-y-1.5">
            {[78, 92, 64].map((w, i) => (
              <div key={i} className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-cosmo-blue to-cyan-400"
                  initial={{ width: "12%" }}
                  whileInView={{ width: `${w}%` }}
                  viewport={{ once: true, amount: 0.6, margin: "0px 0px -80px 0px" }}
                  transition={{ duration: 0.85, delay: 0.2 + 0.12 * i, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: "Secure outbound requests",
      description:
        "Connect-time IP validation via custom DNS lookup hooks on the Undici HTTP agent. Validates resolved socket IPs right before TCP handshake, blocking cloud metadata, loopbacks, and DNS rebinding.",
      icon: ShieldCheck,
      tileBg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
      visual: (
        <div className="mt-4 p-3 rounded-xl bg-black/50 border border-white/10 flex items-center justify-between gap-2 font-mono text-[10px]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-rose-400 line-through">169.254.169.254</span>
          </div>
          <span className="text-cosmo-muted">→</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#16A34A]" />
            <span className="text-emerald-400 font-semibold">Public Unicast</span>
          </div>
        </div>
      ),
    },
    {
      title: "Real data only",
      description:
        "No vanity counters or fabricated statistics. P50, P95, and P99 latency percentiles and uptime SLA percentages are calculated dynamically from raw persisted execution results.",
      icon: BarChart3,
      tileBg: "bg-purple-500/15 text-purple-400 border-purple-500/30",
      visual: (
        <div className="mt-4 p-3 rounded-xl bg-black/50 border border-white/10 grid grid-cols-3 gap-2 text-center font-mono">
          <div className="p-1.5 rounded-lg bg-white/5">
            <div className="text-[9px] text-cosmo-muted">P50</div>
            <div className="text-xs font-bold text-white">Median</div>
          </div>
          <div className="p-1.5 rounded-lg bg-cosmo-blue/15 border border-cosmo-blue/30">
            <div className="text-[9px] text-blue-300">P95</div>
            <div className="text-xs font-bold text-white">SLA</div>
          </div>
          <div className="p-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30">
            <div className="text-[9px] text-cosmo-gold">P99</div>
            <div className="text-xs font-bold text-white">Tail</div>
          </div>
        </div>
      ),
    },
    {
      title: "Signed and retried alerts",
      description:
        "Every webhook payload is cryptographically signed with HMAC-SHA256 and verified with replay-window tolerance. Transient recipient outages automatically retry with exponential backoff (5s, 30s, 120s).",
      icon: BellRing,
      tileBg: "bg-amber-500/15 text-cosmo-amber border-amber-500/30",
      visual: (
        <div className="mt-4 p-3 rounded-xl bg-black/50 border border-white/10 flex items-center justify-between font-mono text-[10px]">
          <span className="px-2 py-0.5 rounded bg-white/5 text-cosmo-silver">Attempt 1: 5s</span>
          <span className="text-cosmo-muted">→</span>
          <span className="px-2 py-0.5 rounded bg-white/5 text-cosmo-silver">Attempt 2: 30s</span>
          <span className="text-cosmo-muted">→</span>
          <span className="px-2 py-0.5 rounded bg-cta/15 text-cta border border-cta/30">120s</span>
        </div>
      ),
    },
  ];

  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-14 relative">
      {/* Ambient radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-cosmo-blue/10 blur-[140px] rounded-full pointer-events-none" />

      <motion.div
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4, margin: "0px 0px -100px 0px" }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="text-center space-y-4 max-w-2xl mx-auto relative z-10"
      >
        <Badge variant="section">EXCEPTIONALITIES</Badge>
        <h2 className="font-heading text-3xl sm:text-5xl font-bold tracking-tight text-white">
          What sets TraceDeck{" "}
          <span className="font-serif italic font-normal text-cta">apart</span>
        </h2>
        <p className="text-sm sm:text-base text-cosmo-muted leading-relaxed">
          Architected for resilience, zero-trust security, and strict database consistency rather than simple uptime pings.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.title}
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 36 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3, margin: "0px 0px -100px 0px" }}
              transition={{ duration: 0.55, delay: idx * 0.08, ease: [0.22, 1, 0.36, 1] }}
              whileHover={prefersReducedMotion ? undefined : { y: -4 }}
              className="p-7 sm:p-8 rounded-card cosmo-glass hover:border-white/25 transition-all duration-300 flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center border ${item.tileBg} transition-transform duration-300 group-hover:scale-105`}
                >
                  <Icon className="w-6 h-6 stroke-[2]" />
                </div>

                <h3 className="font-heading text-xl font-bold text-white">
                  {item.title}
                </h3>

                <p className="text-sm text-cosmo-muted leading-relaxed">
                  {item.description}
                </p>
              </div>

              {item.visual}
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
