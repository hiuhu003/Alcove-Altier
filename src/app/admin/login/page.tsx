"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { LogoMark } from "@/components/Logo";

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Login failed");
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-charcoal px-6 text-cream">
      <form onSubmit={onSubmit} className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <LogoMark className="h-12 text-cream" />
          <div>
            <h1 className="font-serif text-3xl">Atelier Dashboard</h1>
            <p className="text-sm text-cream/60">Sign in to manage your store</p>
          </div>
        </div>

        <label className="mb-2 block text-sm text-cream/70">Password</label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cream/40" />
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 w-full rounded-full border border-cream/20 bg-transparent pl-11 pr-4 text-sm text-cream focus:border-pink-strong focus:outline-none"
            placeholder="Enter admin password"
          />
        </div>

        {error && <p className="mt-3 text-sm text-pink-strong">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-pink-strong font-medium text-white transition-transform hover:scale-[1.01] disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
        </button>

        <p className="mt-6 text-center text-xs text-cream/40">
          Default dev password: <code className="text-cream/60">alcove-admin</code>
          <br />Set <code>ADMIN_PASSWORD</code> in your environment to change it.
        </p>
      </form>
    </div>
  );
}
