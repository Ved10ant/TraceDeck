"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Badge } from "../Badge";

export function HowItWorksSection() {
  const prefersReducedMotion = useReducedMotion();

  const steps = [
    {
      step: "01.",
      title: "Add an endpoint",
      description:
        "Provide your API URL, HTTP method (GET or HEAD), and desired probe frequency (30s to 5m). Pre-checks reject dangerous ports, local IP literals, and invalid protocol schemes upfront.",
    },
    {
      step: "02.",
      title: "Workers check it safely",
      description:
        "BullMQ workers pop scheduled jobs and initiate HTTP probes through an Undici agent with socket-layer IP resolution. Target IPs are validated at connection time, preventing DNS rebinding.",
    },
    {
      step: "03.",
      title: "Get one clean incident & alert",
      description:
        "After 3 consecutive failures, the state machine opens a single deduplicated incident backed by a PostgreSQL partial unique index. HMAC-signed notifications dispatch immediately.",
    },
  ];

  return (
    <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-16 relative">
      <motion.div
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4, margin: "0px 0px -100px 0px" }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="text-center space-y-4 max-w-2xl mx-auto"
      >
        <Badge variant="section">ARCHITECTURE FLOW</Badge>
        <h2 className="font-heading text-3xl sm:text-5xl font-bold tracking-tight text-white">
          How TraceDeck <span className="font-serif italic font-normal text-cta">works</span>
        </h2>
        <p className="text-sm sm:text-base text-cosmo-muted">
          A three-step architecture engineered for reliability, zero-trust safety, and zero alert fatigue.
        </p>
      </motion.div>

      <div className="relative">
        {/* Cosmoq Glowing Energy Beam connecting the 3 steps (Desktop) */}
        <div className="hidden md:block absolute top-11 left-[12%] right-[12%] h-[2px] bg-white/10 z-0 overflow-hidden rounded-full">
          <motion.div
            className="h-full w-1/3 bg-gradient-to-r from-transparent via-cosmo-blue via-cta to-transparent"
            animate={prefersReducedMotion ? undefined : { x: ["-100%", "350%"] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "linear" }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          {steps.map((s, idx) => (
            <motion.div
              key={s.step}
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 36 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3, margin: "0px 0px -100px 0px" }}
              transition={{ duration: 0.55, delay: idx * 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="p-8 rounded-card cosmo-glass hover:border-white/25 transition-all duration-300 space-y-4 relative group"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-black/60 border border-white/15 font-stat font-bold text-lg text-cta shadow-[0_0_20px_rgba(255,90,31,0.2)] group-hover:scale-105 transition-transform">
                {s.step}
              </div>

              <h3 className="font-heading text-xl font-bold text-white">
                {s.title}
              </h3>

              <p className="text-sm text-cosmo-muted leading-relaxed">
                {s.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
