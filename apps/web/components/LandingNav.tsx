"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldCheck, Menu, X } from "lucide-react";
import { Button } from "./Button";
import { getAuthToken } from "../lib/api";

export function LandingNav() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsAuthenticated(!!getAuthToken());
  }, []);

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "How it works", href: "#how-it-works" },
    { label: "Security", href: "#security" },
    { label: "Open source", href: "#open-source" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <motion.nav
      initial={{ opacity: 0, y: -40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"
    >
      <div className="w-full max-w-5xl pointer-events-auto">
        <div className="cosmo-pill-nav rounded-pill px-4 sm:px-6 py-2.5 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-full bg-cta/15 border border-cta/40 flex items-center justify-center text-cta group-hover:scale-105 transition-transform shadow-[0_0_16px_rgba(255,90,31,0.3)]">
              <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="font-heading font-bold text-base tracking-tight text-white">
              TraceDeck
            </span>
          </Link>

          {/* Center Links (Desktop with Cosmoq underline wrap reveal) */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="relative group text-xs font-medium text-cosmo-muted hover:text-white transition-colors py-1"
              >
                <span>{link.label}</span>
                <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-gradient-to-r from-cosmo-blue via-cta to-cosmo-amber transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </div>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            {isAuthenticated ? (
              <Button href="/dashboard" size="sm" withArrow>
                Dashboard
              </Button>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-xs font-medium text-cosmo-muted hover:text-white px-2.5 py-1.5 transition-colors"
                >
                  Sign in
                </Link>
                <Button href="/register" size="sm" withArrow>
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="sm:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-white focus:outline-none"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="sm:hidden mt-2 cosmo-glass rounded-2xl p-4 shadow-2xl space-y-3"
          >
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-medium text-cosmo-silver hover:text-white py-1.5 px-3 rounded-lg hover:bg-white/5"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
              <Link
                href="/login"
                className="text-sm font-medium text-center py-2 text-cosmo-silver hover:text-white"
              >
                Sign in
              </Link>
              <Button
                href={isAuthenticated ? "/dashboard" : "/register"}
                size="sm"
                withArrow
                className="w-full"
              >
                {isAuthenticated ? "Dashboard" : "Get Started"}
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
}
