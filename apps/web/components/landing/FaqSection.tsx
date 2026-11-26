"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Plus } from "lucide-react";
import { Badge } from "../Badge";

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const prefersReducedMotion = useReducedMotion();

  const faqs = [
    {
      q: "What is TraceDeck?",
      a: "TraceDeck is an open source, developer-first API observability and incident management platform. It continuously executes HTTP health checks, measures tail latency (P50/P95/P99), opens deduplicated incidents, and dispatches HMAC-signed webhook notifications.",
    },
    {
      q: "How is SSRF prevented?",
      a: "Unlike typical pre-check filters vulnerable to DNS Rebinding and TOCTOU attacks, TraceDeck hooks into Undici's agent at the socket layer. Target IP addresses are validated during DNS resolution right before the TCP handshake. Cloud metadata (169.254.169.254), loopbacks (127.0.0.1, ::1), private RFC1918 subnets, and IPv4-mapped IPv6 addresses are blocked unconditionally.",
    },
    {
      q: "How are duplicate incidents avoided?",
      a: "TraceDeck enforces deduplication at the database storage engine layer using a PostgreSQL Partial Unique Index: CREATE UNIQUE INDEX ON Incident (monitorId) WHERE status != 'RESOLVED'. If multiple background workers detect failures concurrently, only one incident can remain active for that monitor.",
    },
    {
      q: "What happens when a webhook fails?",
      a: "Outbound webhook alerts are stored as NotificationDelivery records. If the recipient server fails with a 5xx status or network timeout, TraceDeck automatically schedules retries using exponential backoff with delays of 5 seconds, 30 seconds, and 120 seconds before marking the delivery as failed.",
    },
    {
      q: "Can it monitor private or internal URLs?",
      a: "No, by design. TraceDeck's connect-time SSRF guard explicitly blocks loopback, link-local, and RFC1918 private subnets to protect internal cloud infrastructure from unauthorized probing.",
    },
    {
      q: "How do I self-host it?",
      a: "TraceDeck is 100% open source under the MIT license. Clone the repository, run 'docker compose up -d postgres redis', run 'npm install && npm run db:push', and start the API, worker, and web services with Node.js 22.",
    },
  ];

  return (
    <section id="faq" className="py-14 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      <motion.div
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.3, margin: "0px 0px -60px 0px" }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="text-center space-y-4"
      >
        <Badge variant="section">FAQ</Badge>
        <h2 className="font-heading text-3xl sm:text-5xl font-bold tracking-tight text-white">
          Frequently asked <span className="font-serif italic font-normal text-cta">questions</span>
        </h2>
        <p className="text-sm text-cosmo-muted">
          Clear answers about architecture, security, and operation.
        </p>
      </motion.div>

      <div className="space-y-3">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={faq.q}
              className={`rounded-2xl transition-colors duration-200 ${
                isOpen ? "cosmo-glass-rim" : "cosmo-glass hover:border-white/20"
              }`}
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left text-sm sm:text-base font-semibold font-heading text-white focus:outline-none"
                aria-expanded={isOpen}
              >
                <span>{faq.q}</span>
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center border border-white/10 bg-white/5 shrink-0 ml-4 transition-transform duration-300 ${
                    isOpen ? "rotate-45 text-cta border-cta/40" : "text-cosmo-muted"
                  }`}
                >
                  <Plus className="w-4 h-4" />
                </span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={prefersReducedMotion ? { opacity: 1 } : { height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={prefersReducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5 text-xs sm:text-sm text-cosmo-muted leading-relaxed border-t border-white/5 pt-3">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}
