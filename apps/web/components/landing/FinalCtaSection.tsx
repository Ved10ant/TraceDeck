"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Github, Clock } from "lucide-react";
import { Button } from "../Button";
import { Badge } from "../Badge";
import { getAuthToken } from "../../lib/api";

export function FinalCtaSection() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    setIsAuthenticated(!!getAuthToken());
  }, []);

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto relative">
      {/* Ambient glow */}
      <div className="absolute inset-x-10 top-1/2 -translate-y-1/2 h-64 bg-gradient-to-r from-cosmo-blue/15 via-cta/15 to-cosmo-amber/15 blur-[130px] rounded-full pointer-events-none" />

      <motion.div
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25, margin: "0px 0px -120px 0px" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-3xl cosmo-glass-rim text-white p-8 sm:p-12 lg:p-16 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center relative z-10 overflow-hidden"
      >
        {/* Left Side: Copy & Buttons */}
        <div className="space-y-6">
          <Badge variant="section">START MONITORING</Badge>

          <h2 className="font-heading text-3xl sm:text-5xl font-bold tracking-tight leading-[1.08]">
            Start monitoring your first API in{" "}
            <span className="font-serif italic font-normal text-cta">minutes</span>.
          </h2>

          <p className="text-sm sm:text-base text-cosmo-muted leading-relaxed max-w-md">
            No credit cards, no fake limits. Experience zero-alert-fatigue observability with connect-time SSRF security.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Button
              href={isAuthenticated ? "/dashboard" : "/register"}
              size="lg"
              withArrow
            >
              Get Started
            </Button>
            <Button
              href="https://github.com/Ved10ant/TraceDeck"
              variant="secondary"
              size="lg"
              className="gap-2"
            >
              <Github className="w-4 h-4" />
              View on GitHub
            </Button>
          </div>
        </div>

        {/* Right Side: Floating Incident Timeline Card (Sample Data) */}
        <div className="relative space-y-3">
          <motion.div
            whileHover={prefersReducedMotion ? undefined : { y: -4 }}
            transition={{ duration: 0.25 }}
            className="p-6 rounded-2xl bg-black/70 border border-white/15 space-y-4 shadow-2xl backdrop-blur-md"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-cosmo-silver">
                Incident Timeline
              </span>
              <Badge variant="sample">Sample data</Badge>
            </div>

            <div className="space-y-3.5 font-mono text-xs">
              <div className="flex items-start gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-400 mt-1 shrink-0 shadow-[0_0_8px_#E5484D]" />
                <div>
                  <div className="text-white font-semibold">Incident Auto-Opened (HTTP 500)</div>
                  <div className="text-cosmo-muted text-[11px]">
                    3 consecutive failures on Payment Gateway
                  </div>
                  <div className="text-cosmo-muted/70 text-[10px] flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" /> 14:32:00 UTC
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-cta mt-1 shrink-0 shadow-[0_0_8px_#FF5A1F]" />
                <div>
                  <div className="text-white font-semibold">HMAC Webhook Dispatched</div>
                  <div className="text-cta text-[11px]">
                    Signed payload delivered with sha256 signature
                  </div>
                  <div className="text-cosmo-muted/70 text-[10px] flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" /> 14:32:01 UTC
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 mt-1 shrink-0 shadow-[0_0_8px_#16A34A]" />
                <div>
                  <div className="text-emerald-400 font-semibold">
                    Auto-Resolved (2 Consecutive 200 OK)
                  </div>
                  <div className="text-cosmo-muted text-[11px]">
                    Recovery threshold met, duration 6m 12s
                  </div>
                  <div className="text-cosmo-muted/70 text-[10px] flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" /> 14:38:12 UTC
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
