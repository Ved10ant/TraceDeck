"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Clock } from "lucide-react";
import { Button } from "../Button";
import { Badge } from "../Badge";
import { getAuthToken } from "../../lib/api";

export function SelfHostSection() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    setIsAuthenticated(!!getAuthToken());
  }, []);

  const plannedFeatures = [
    "Public status pages with custom domains",
    "Multi-region probing workers (US, EU, APAC)",
    "Google OAuth & SAML SSO",
    "Prometheus / OpenTelemetry metrics export",
  ];

  return (
    <section id="open-source" className="py-14 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-10 relative">
      <motion.div
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.3, margin: "0px 0px -60px 0px" }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="text-center space-y-4 max-w-2xl mx-auto"
      >
        <Badge variant="section">OPEN SOURCE</Badge>
        <h2 className="font-heading text-3xl sm:text-5xl font-bold tracking-tight text-white">
          Open source & <span className="font-serif italic font-normal text-cta">self-hostable</span>
        </h2>
        <p className="text-sm sm:text-base text-cosmo-muted">
          No paywalls or fake pricing tiers. Free, open source software under the permissive MIT license.
        </p>
      </motion.div>

      <motion.div
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.15, margin: "0px 0px -60px 0px" }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-3xl mx-auto rounded-3xl cosmo-glass-rim p-8 sm:p-10 space-y-8 relative overflow-hidden"
      >
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="inline-block px-3 py-1 rounded-pill bg-cta/15 border border-cta/30 text-cta text-[11px] font-mono font-bold uppercase tracking-wider mb-2.5">
              MIT LICENSE
            </div>
            <h3 className="font-heading text-2xl font-bold text-white">
              Free and open source (MIT)
            </h3>
            <p className="text-xs sm:text-sm text-cosmo-muted mt-1">
              Own your telemetry data. Run locally with Docker or deploy to your own cloud infrastructure.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              href={isAuthenticated ? "/dashboard" : "/register"}
              variant="primary"
              size="md"
              withArrow
            >
              Get Started
            </Button>
            <Button
              href="https://github.com/Ved10ant/TraceDeck"
              variant="secondary"
              size="md"
            >
              GitHub Repo
            </Button>
          </div>
        </div>

        {/* Real Quickstart Code Card */}
        <div className="space-y-3">
          <span className="text-xs font-mono font-semibold text-cosmo-silver uppercase tracking-wider">
            Quickstart in 4 commands:
          </span>
          <div className="p-5 rounded-2xl bg-black/80 font-mono text-xs text-cosmo-silver border border-white/10 space-y-2 overflow-x-auto">
            <div><span className="text-cosmo-muted"># 1. Clone repository</span></div>
            <div className="text-emerald-400">git clone https://github.com/Ved10ant/TraceDeck.git</div>
            <div><span className="text-cosmo-muted"># 2. Spin up PostgreSQL & Redis</span></div>
            <div className="text-emerald-400">docker compose up -d postgres redis</div>
            <div><span className="text-cosmo-muted"># 3. Install & sync database</span></div>
            <div className="text-emerald-400">npm install &amp;&amp; npm run db:push</div>
            <div><span className="text-cosmo-muted"># 4. Start API, Worker &amp; Dashboard</span></div>
            <div className="text-emerald-400">npm run dev:api &amp;&amp; npm run dev:worker &amp;&amp; npm run dev:web</div>
          </div>
        </div>

        {/* Planned Roadmap List */}
        <div className="pt-4 border-t border-white/10 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cosmo-silver">
            <Clock className="w-3.5 h-3.5 text-cta" />
            Planned in upcoming releases:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-cosmo-muted">
            {plannedFeatures.map((f) => (
              <div key={f} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cta/70" />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
