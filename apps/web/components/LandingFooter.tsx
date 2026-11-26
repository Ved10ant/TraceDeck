import Link from "next/link";
import { ShieldCheck, Github, ExternalLink } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="relative border-t border-white/10 bg-cosmo-bg py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Subtle bottom atmospheric glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[160px] bg-cosmo-blue/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-cta/15 border border-cta/40 flex items-center justify-center text-cta">
                <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="font-heading font-bold text-base text-white">
                TraceDeck
              </span>
            </div>
            <p className="text-xs text-cosmo-muted leading-relaxed">
              Developer-first API observability and incident management platform.
            </p>
            <div className="text-[11px] text-cosmo-muted/80 font-mono">
              MIT Licensed • Open Source
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
              Product
            </h4>
            <ul className="space-y-2 text-xs text-cosmo-muted">
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-white transition-colors">
                  How it works
                </a>
              </li>
              <li>
                <a href="#security" className="hover:text-white transition-colors">
                  SSRF Security
                </a>
              </li>
              <li>
                <Link href="/register" className="hover:text-white transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Docs Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
              Docs
            </h4>
            <ul className="space-y-2 text-xs text-cosmo-muted">
              <li>
                <a
                  href="https://github.com/Ved10ant/TraceDeck/blob/main/docs/ARCHITECTURE.md"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors inline-flex items-center gap-1"
                >
                  Architecture <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/Ved10ant/TraceDeck/blob/main/docs/SECURITY.md"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors inline-flex items-center gap-1"
                >
                  SSRF Threat Model <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/Ved10ant/TraceDeck/blob/main/docs/DECISIONS.md"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors inline-flex items-center gap-1"
                >
                  Decisions Record <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/Ved10ant/TraceDeck/blob/main/docs/API.md"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors inline-flex items-center gap-1"
                >
                  API Contracts <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </li>
            </ul>
          </div>

          {/* Project & Community */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
              Project
            </h4>
            <ul className="space-y-2 text-xs text-cosmo-muted">
              <li>
                <a
                  href="https://github.com/Ved10ant/TraceDeck"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors inline-flex items-center gap-1.5"
                >
                  <Github className="w-3.5 h-3.5" /> GitHub Repository
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/Ved10ant/TraceDeck/blob/main/LICENSE"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors"
                >
                  MIT License
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/Ved10ant/TraceDeck/actions"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors"
                >
                  CI/CD Pipeline
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-cosmo-muted">
          <div>
            Built by <span className="font-semibold text-white">Vedant Dighe</span>
          </div>
          <div>© {new Date().getFullYear()} TraceDeck. Open source observability.</div>
        </div>
      </div>
    </footer>
  );
}
