"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { Github, CheckCircle2, AlertTriangle, ShieldCheck, Activity, Clock } from "lucide-react";
import { Button } from "../Button";
import { Badge } from "../Badge";
import { getAuthToken } from "../../lib/api";

export function HeroSection() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    setIsAuthenticated(!!getAuthToken());
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const parallaxMain = useTransform(scrollYProgress, [0, 1], [0, prefersReducedMotion ? 0 : -45]);
  const parallaxFloatLeft = useTransform(scrollYProgress, [0, 1], [0, prefersReducedMotion ? 0 : -75]);
  const parallaxFloatRight = useTransform(scrollYProgress, [0, 1], [0, prefersReducedMotion ? 0 : -65]);

  return (
    <section
      ref={containerRef}
      className="relative pt-32 pb-24 md:pt-40 md:pb-36 px-4 sm:px-6 lg:px-8 overflow-hidden bg-cosmo-bg"
    >
      {/* Cosmoq Background Video Layer + Subtle Frost + Noise */}
      <div className="absolute top-0 left-0 right-0 h-[860px] pointer-events-none overflow-hidden cosmo-video-mask z-0">
        <motion.div
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0.2, y: 60, scale: 1.06 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          className="w-full h-full"
        >
          <video
            src="/videos/hero-bg.mp4"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            aria-hidden="true"
            className="w-full h-full object-cover object-center brightness-110 contrast-105"
          />
        </motion.div>

        {/* Subtle Frost Blur Radial Mask Layer */}
        <div className="absolute inset-0 cosmo-frost" />

        {/* Noise Grain Layer */}
        <div className="absolute inset-0 cosmo-noise" />

        {/* Lighter Vignette so video shines vividly while blending smoothly into #000 at bottom */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(1, 117, 255, 0.08) 0%, transparent 60%), linear-gradient(180deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.06) 45%, #000000 100%)",
          }}
        />
      </div>

      <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
        {/* Badge Pill */}
        <motion.div
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-pill cosmo-glass text-xs text-cosmo-silver"
        >
          <span className="w-2 h-2 rounded-full bg-cta animate-pulse shadow-[0_0_8px_#FF5A1F]" />
          <span className="font-medium tracking-wide">Open source — built for developers</span>
        </motion.div>

        {/* 2-line Headline with Serif Italic */}
        <motion.h1
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 50, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.65, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="font-heading text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white max-w-4xl mx-auto leading-[1.06]"
        >
          Know when your APIs{" "}
          <span className="font-serif italic font-normal text-cta drop-shadow-[0_0_24px_rgba(255,90,31,0.35)]">
            break
          </span>
          .
          <br className="hidden sm:inline" /> Before your users do.
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.16 }}
          className="text-base sm:text-lg text-cosmo-silver/85 max-w-2xl mx-auto leading-relaxed"
        >
          Probe your endpoints safely with connect-time SSRF guards, open one clean deduplicated incident, and alert your team via signed HMAC webhooks.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.24 }}
          className="flex flex-wrap items-center justify-center gap-4 pt-2"
        >
          <Button href={isAuthenticated ? "/dashboard" : "/register"} size="lg" withArrow>
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
        </motion.div>

        {/* Hero Art: Rim-lit Glassmorphism Dashboard Composition with Parallax */}
        <motion.div
          style={{ y: parallaxMain }}
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 45 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="pt-12 relative max-w-4xl mx-auto"
        >
          {/* Floating Left Glass Card (Desktop Parallax) */}
          <motion.div
            style={{ y: parallaxFloatLeft }}
            className="hidden lg:flex flex-col gap-1.5 p-3.5 rounded-2xl cosmo-glass-rim absolute -left-10 top-24 z-20 w-56 text-left pointer-events-none"
          >
            <div className="flex items-center justify-between text-[10px] font-mono text-cosmo-muted">
              <span>SSRF SOCKET GUARD</span>
              <span className="text-emerald-400 font-semibold">ACTIVE</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-white">
              <ShieldCheck className="w-4 h-4 text-cosmo-blue shrink-0" />
              <span>169.254.169.254 blocked</span>
            </div>
            <div className="text-[10px] font-mono text-cosmo-muted">
              connect.lookup() verified
            </div>
          </motion.div>

          {/* Floating Right Glass Card (Desktop Parallax) */}
          <motion.div
            style={{ y: parallaxFloatRight }}
            className="hidden lg:flex flex-col gap-1.5 p-3.5 rounded-2xl cosmo-glass-rim absolute -right-10 bottom-16 z-20 w-60 text-left pointer-events-none"
          >
            <div className="flex items-center justify-between text-[10px] font-mono text-cosmo-muted">
              <span>INCIDENT DEDUPLICATION</span>
              <span className="text-cosmo-amber font-semibold">PG INDEX</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-white">
              <Activity className="w-4 h-4 text-cta shrink-0" />
              <span>1 active per monitor</span>
            </div>
            <div className="text-[10px] font-mono text-cosmo-muted">
              3 fails open • 2 ok resolve
            </div>
          </motion.div>

          {/* Main Glassmorphic Dashboard Preview */}
          <div className="relative rounded-card cosmo-glass-rim p-5 sm:p-7 space-y-5 text-left">
            {/* Top Bar with Sample Data Badge */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
                </div>
                <span className="text-xs font-mono text-cosmo-muted hidden sm:inline">
                  tracedeck.app/dashboard
                </span>
              </div>
              <Badge variant="sample">Sample data</Badge>
            </div>

            {/* Simulated Live Monitor Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-2 hover:border-white/20 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">Auth Service</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" /> 200 OK
                  </span>
                </div>
                <div className="font-mono text-[11px] text-cosmo-muted truncate">
                  https://auth.example.com/health
                </div>
                <div className="pt-2 flex items-center justify-between text-xs border-t border-white/5">
                  <span className="text-cosmo-muted">P95 Latency</span>
                  <span className="font-stat font-bold text-white">42 ms</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-black/50 border border-rose-500/30 space-y-2 shadow-[inset_0_0_16px_rgba(229,72,77,0.12)]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">Billing Ingestion</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-400">
                    <AlertTriangle className="w-3 h-3" /> 503 Error
                  </span>
                </div>
                <div className="font-mono text-[11px] text-cosmo-muted truncate">
                  https://billing.example.com/v1/charge
                </div>
                <div className="pt-2 flex items-center justify-between text-xs border-t border-white/5">
                  <span className="text-rose-400 font-medium">Incident Opened</span>
                  <span className="text-[11px] font-mono text-cosmo-muted">3 fails</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-2 hover:border-white/20 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">Webhook Alerts</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-cosmo-blue">
                    <Clock className="w-3 h-3" /> HMAC Signed
                  </span>
                </div>
                <div className="font-mono text-[11px] text-cosmo-muted truncate">
                  X-TraceDeck-Signature: sha256=...
                </div>
                <div className="pt-2 flex items-center justify-between text-xs border-t border-white/5">
                  <span className="text-cosmo-muted">Retry Backoff</span>
                  <span className="font-stat font-bold text-white">5s • 30s • 120s</span>
                </div>
              </div>
            </div>

            {/* Bottom Telemetry Bar */}
            <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-mono text-cosmo-silver">
                  Undici Socket Validator:{" "}
                  <span className="text-emerald-400 font-semibold">Protected</span>
                </span>
              </div>
              <div className="flex items-center gap-5 text-xs font-mono">
                <div>
                  <span className="text-cosmo-muted">P50:</span>{" "}
                  <span className="text-white font-bold">28ms</span>
                </div>
                <div>
                  <span className="text-cosmo-muted">P95:</span>{" "}
                  <span className="text-cosmo-blue font-bold">54ms</span>
                </div>
                <div>
                  <span className="text-cosmo-muted">P99:</span>{" "}
                  <span className="text-cosmo-amber font-bold">89ms</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
