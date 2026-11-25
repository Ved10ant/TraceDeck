"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ShieldAlert, Database, Key } from "lucide-react";
import { Badge } from "../Badge";

export function DeepDiveSection() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section id="security" className="py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto relative">
      {/* Ambient blue/orange background glow behind deep dive card */}
      <div className="absolute -inset-4 bg-gradient-to-tr from-cosmo-blue/10 via-transparent to-cta/10 blur-3xl rounded-3xl pointer-events-none" />

      <motion.div
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2, margin: "0px 0px -120px 0px" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-3xl cosmo-glass-rim text-slate-100 p-8 sm:p-12 lg:p-14 space-y-12 relative z-10 overflow-hidden"
      >
        <div className="max-w-2xl space-y-4">
          <Badge variant="section">ENGINEERING DEEP DIVE</Badge>
          <h2 className="font-heading text-3xl sm:text-5xl font-bold tracking-tight text-white">
            Under the hood: Built for{" "}
            <span className="font-serif italic font-normal text-cta">zero trust</span>
          </h2>
          <p className="text-sm sm:text-base text-cosmo-muted leading-relaxed">
            Standard uptime monitors blindly fetch whatever URL users input. TraceDeck enforces multi-layer defense at the kernel socket boundary.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: SSRF */}
          <div className="p-6 rounded-2xl bg-black/55 border border-white/10 space-y-4 hover:border-white/20 transition-colors">
            <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
              <ShieldAlert className="w-4 h-4" />
              Connect-Time SSRF Defense
            </div>
            <p className="text-xs text-cosmo-muted leading-relaxed">
              Standard pre-validation suffers from <strong>TOCTOU & DNS Rebinding</strong>. TraceDeck hooks into Undici&apos;s agent to validate every IP at the socket layer immediately prior to TCP handshake.
            </p>
            <div className="p-3.5 rounded-xl bg-black/80 font-mono text-[11px] space-y-1 text-cosmo-silver border border-white/10">
              <div className="text-rose-400">✗ 169.254.169.254 (Cloud metadata)</div>
              <div className="text-rose-400">✗ 127.0.0.1 & [::1] (Loopback)</div>
              <div className="text-rose-400">✗ 10.0.0.0/8 & 192.168.0.0/16 (RFC1918)</div>
              <div className="text-rose-400">✗ ::ffff:127.0.0.1 (IPv4-Mapped IPv6)</div>
              <div className="text-emerald-400 font-semibold pt-1">✓ Public Unicast IPv4/IPv6 only</div>
            </div>
          </div>

          {/* Card 2: Partial Unique Index */}
          <div className="p-6 rounded-2xl bg-black/55 border border-white/10 space-y-4 hover:border-white/20 transition-colors">
            <div className="flex items-center gap-2 text-cosmo-blue font-semibold text-sm">
              <Database className="w-4 h-4" />
              ACID Incident Deduplication
            </div>
            <p className="text-xs text-cosmo-muted leading-relaxed">
              Application-level checks like <code className="text-cosmo-silver">findFirst</code> fail under concurrent distributed workers. We enforce deduplication at the PostgreSQL storage engine level.
            </p>
            <div className="p-3.5 rounded-xl bg-black/80 font-mono text-[11px] text-blue-300 border border-white/10 overflow-x-auto">
              <pre className="leading-relaxed">
{`CREATE UNIQUE INDEX
  "idx_incident_single_active"
ON "Incident" ("monitorId")
WHERE "status" != 'RESOLVED';`}
              </pre>
            </div>
            <p className="text-[11px] text-cosmo-muted">
              Race conditions throw constraint violation <code className="text-cosmo-silver">23505</code>, caught idempotently without duplicate alerts.
            </p>
          </div>

          {/* Card 3: HMAC Signatures */}
          <div className="p-6 rounded-2xl bg-black/55 border border-white/10 space-y-4 hover:border-white/20 transition-colors">
            <div className="flex items-center gap-2 text-cosmo-amber font-semibold text-sm">
              <Key className="w-4 h-4" />
              Cryptographic HMAC-SHA256
            </div>
            <p className="text-xs text-cosmo-muted leading-relaxed">
              Every incident webhook carries cryptographic proof of authenticity and timestamp verification to protect your receiving servers against replay attacks.
            </p>
            <div className="p-3.5 rounded-xl bg-black/80 font-mono text-[11px] text-cosmo-gold border border-white/10 space-y-1.5">
              <div className="text-cosmo-muted">Header:</div>
              <div className="text-cta break-all">X-TraceDeck-Signature: sha256=...</div>
              <div className="text-cosmo-muted pt-1">Tolerance Window:</div>
              <div className="text-emerald-400">300 seconds max skew</div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
