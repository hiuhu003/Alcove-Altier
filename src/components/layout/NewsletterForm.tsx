"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {
      /* non-blocking */
    }
    setLoading(false);
    setDone(true);
  }

  if (done) {
    return (
      <p className="flex items-center gap-2 text-sm text-coral">
        <Check className="h-4 w-4" /> Thanks — you&apos;re on the list.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email"
        className="h-11 w-full rounded-full border border-cream/20 bg-transparent px-4 text-sm text-cream placeholder:text-cream/40 focus:border-coral focus:outline-none"
      />
      <button
        type="submit"
        disabled={loading}
        aria-label="Subscribe"
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-coral text-white transition-transform hover:scale-105 disabled:opacity-60"
      >
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}
