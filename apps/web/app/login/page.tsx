"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, Mail, Lock, ArrowLeft } from "lucide-react";
import { apiRequest, setAuthToken } from "../../lib/api";
import { Button } from "../../components/Button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const res = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (res.success && res.data?.token) {
      setAuthToken(res.data.token);
      router.push("/dashboard");
    } else {
      setError(res.error?.message || "Invalid email or password");
    }
    setSubmitting(false);
  }

  return (
    <div className="dark min-h-screen bg-cosmo-bg text-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Ambient Cosmoq radial glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[320px] bg-cosmo-blue/15 blur-[130px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 space-y-6 relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-cosmo-muted hover:text-white transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </Link>

        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-cta/15 border border-cta/40 text-cta mb-1 shadow-[0_0_20px_rgba(255,90,31,0.3)]">
            <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Welcome back to TraceDeck
          </h1>
          <p className="text-xs sm:text-sm text-cosmo-muted">
            Sign in to access your monitors and incident state machines
          </p>
        </div>

        <div className="rounded-card cosmo-glass-rim p-6 sm:p-8 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-cosmo-silver mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-cosmo-muted absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white text-sm focus:outline-none focus:border-cta font-mono placeholder:text-cosmo-muted/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-cosmo-silver mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-cosmo-muted absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white text-sm focus:outline-none focus:border-cta font-mono placeholder:text-cosmo-muted/50"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              withArrow
              className="w-full mt-2"
            >
              {submitting ? "Authenticating..." : "Sign in to Dashboard"}
            </Button>
          </form>
        </div>

        <div className="text-center text-xs text-cosmo-muted">
          Don&apos;t have a workspace yet?{" "}
          <Link href="/register" className="text-cta font-semibold hover:underline">
            Register free
          </Link>
        </div>
      </div>
    </div>
  );
}
