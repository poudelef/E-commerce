"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import { fieldClass, primaryButton } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const demo = process.env.NODE_ENV !== "production";
  const [email, setEmail] = useState(demo ? "owner@laxmikirana.store" : "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      const next = new URLSearchParams(window.location.search).get("next");
      const target = next && next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin";
      router.push(target);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-card bg-card p-6 shadow-card">
        <p className="text-sm font-bold uppercase tracking-wide text-primary">Owner</p>
        <h1 className="mt-1 text-2xl font-extrabold">Laxmi Kirana Store</h1>
        <p className="mt-2 text-sm text-muted">Sign in to pack orders and manage the shelf.</p>
        <label className="mt-5 block text-sm font-semibold">
          Email
          <input className={`${fieldClass} mt-1`} type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label className="mt-3 block text-sm font-semibold">
          Password
          <input className={`${fieldClass} mt-1`} type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </label>
        {error ? <p className="mt-3 text-sm font-semibold text-primary" role="alert">{error}</p> : null}
        <button className={`${primaryButton} mt-5 w-full`} disabled={loading} type="submit">
          {loading ? "Signing in..." : "Sign in"}
        </button>
        {demo ? (
          <p className="mt-4 text-xs text-muted">
            Local demo account: use OWNER_EMAIL and OWNER_PASSWORD from your .env file.
          </p>
        ) : null}
      </form>
    </main>
  );
}
