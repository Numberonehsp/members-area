"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LandingPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        router.push("/dashboard");
      } else {
        const data = await res.json();
        setError(data.error ?? "Login failed. Please check your details and try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-facets text-text-on-dark px-6 relative overflow-hidden">
      {/* Soft brand glow */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-brand/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-32 w-[28rem] h-[28rem] rounded-full bg-brand-light/10 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="mb-10 text-center">
          <p className="text-[10px] tracking-[0.4em] uppercase text-brand-light mb-4">
            Number One · Health · Strength · Performance
          </p>
          <h1 className="font-display text-6xl md:text-7xl leading-none mb-4">
            Members
            <br />
            <span className="text-brand">Area</span>
          </h1>
          <p className="text-text-on-dark/70 text-sm">
            Sign in with your GymMaster credentials to access your dashboard,
            results and learning hub.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 backdrop-blur-sm space-y-4"
        >
          <div>
            <label className="block text-xs font-medium text-text-on-dark/70 mb-1.5">
              Email address
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-text-on-dark placeholder:text-text-on-dark/30 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-on-dark/70 mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-text-on-dark placeholder:text-text-on-dark/30 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
            />
          </div>

          {error && (
            <p className="text-sm text-status-red bg-status-red/10 border border-status-red/20 rounded-lg px-4 py-2.5">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white font-semibold py-3 rounded-lg text-sm"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="text-center mt-4">
          <Link
            href="/coach/login"
            className="text-xs text-text-on-dark/40 hover:text-text-on-dark/70 transition-colors"
          >
            Coach login →
          </Link>
        </p>

        <p className="text-center text-[11px] tracking-[0.2em] uppercase text-text-on-dark/40 mt-8">
          Queensferry · Flintshire
        </p>
      </div>
    </div>
  );
}
