"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Laptop, Rocket, Users, AlertCircle } from "lucide-react";
import { Badge } from "../Badge";

export function AudienceSection() {
  const prefersReducedMotion = useReducedMotion();

  const audiences = [
    {
      title: "Indie Developers",
      description:
        "Ship micro-SaaS and side projects with confidence. Know instantly if your third-party payment or auth endpoints stop responding without bloated enterprise suites.",
      icon: Laptop,
    },
    {
      title: "Startups & Growth Teams",
      description:
        "Protect critical business workflows and customer-facing APIs. Calculate real P95/P99 latency SLAs without installing heavy client SDKs in your codebase.",
      icon: Rocket,
    },
    {
      title: "DevOps & Platform Teams",
      description:
        "Run inside your VPC or private network with full source control. Extend BullMQ queues, customize check workers, and integrate with existing Redis clusters.",
      icon: Users,
    },
    {
      title: "Incident Responders",
      description:
        "Eliminate duplicate alert floods when services go down. One clean incident lifecycle (Investigating → Identified → Monitoring → Resolved) backed by PostgreSQL.",
      icon: AlertCircle,
    },
  ];

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-14">
      <motion.div
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4, margin: "0px 0px -100px 0px" }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="text-center space-y-4 max-w-2xl mx-auto"
      >
        <Badge variant="section">USE CASES</Badge>
        <h2 className="font-heading text-3xl sm:text-5xl font-bold tracking-tight text-white">
          Who TraceDeck is <span className="font-serif italic font-normal text-cta">built for</span>
        </h2>
        <p className="text-sm sm:text-base text-cosmo-muted">
          Engineered for developers who value safety, real metrics, and architectural clarity.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {audiences.map((a, idx) => {
          const Icon = a.icon;
          return (
            <motion.div
              key={a.title}
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3, margin: "0px 0px -100px 0px" }}
              transition={{ duration: 0.5, delay: idx * 0.08, ease: [0.22, 1, 0.36, 1] }}
              whileHover={prefersReducedMotion ? undefined : { y: -4 }}
              className="p-6 rounded-card cosmo-glass hover:border-white/25 transition-all duration-300 space-y-4"
            >
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-cta">
                <Icon className="w-5 h-5 stroke-[2]" />
              </div>
              <h3 className="font-heading font-bold text-base text-white">
                {a.title}
              </h3>
              <p className="text-xs text-cosmo-muted leading-relaxed">
                {a.description}
              </p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
