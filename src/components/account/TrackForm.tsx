"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { OrderTracker, type TrackedOrder } from "@/components/account/OrderTracker";

/**
 * Guest order tracking. Reference + the email the order was placed with —
 * both, because a five-character reference on its own would let anyone page
 * through other people's orders.
 */
export function TrackForm({ initialRef = "" }: { initialRef?: string }) {
  const refId = useId();
  const emailId = useId();
  const [form, setForm] = useState({ ref: initialRef, email: "" });
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOrder(null);
    setLoading(true);
    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "We couldn't find that order.");
      } else {
        setOrder(data.order as TrackedOrder);
      }
    } catch {
      setError("We couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-x pb-24 pt-[calc(var(--header-h)+2rem)]">
      <div className="mx-auto max-w-2xl">
        <p className="text-sm uppercase tracking-[0.2em] text-graphite">Order tracking</p>
        <h1 className="mt-2 font-serif text-4xl sm:text-5xl">Where&apos;s my order?</h1>
        <p className="mt-3 leading-relaxed text-graphite">
          Enter the reference from your confirmation (it looks like{" "}
          <span className="font-medium text-charcoal">AA-7F3K9</span>) and the email you
          ordered with.
        </p>

        <form
          onSubmit={onSubmit}
          className="mt-8 rounded-3xl border border-charcoal/10 bg-white/60 p-6 sm:p-7"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={refId} className="mb-1.5 block text-sm font-medium">
                Order reference
              </label>
              <input
                id={refId}
                required
                value={form.ref}
                onChange={(e) => setForm((f) => ({ ...f, ref: e.target.value.toUpperCase() }))}
                placeholder="AA-7F3K9"
                className="h-12 w-full rounded-xl border border-charcoal/15 bg-white/70 px-4 text-sm uppercase tracking-wider focus:border-pink-strong focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor={emailId} className="mb-1.5 block text-sm font-medium">
                Email used to order
              </label>
              <input
                id={emailId}
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="h-12 w-full rounded-xl border border-charcoal/15 bg-white/70 px-4 text-sm focus:border-pink-strong focus:outline-none"
              />
            </div>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              role="alert"
              className="mt-4 rounded-xl bg-coral/10 px-4 py-3 text-sm text-charcoal"
            >
              {error}
            </motion.p>
          )}

          <Button type="submit" size="lg" className="mt-5 w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Looking…
              </>
            ) : (
              <>
                <Search className="h-4 w-4" /> Track my order
              </>
            )}
          </Button>
        </form>

        {order && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
            <OrderTracker order={order} defaultOpen />
          </motion.div>
        )}

        <p className="mt-8 text-sm text-graphite">
          Have an account?{" "}
          <Link href="/signin?next=/account" className="text-pink-strong underline underline-offset-4">
            Sign in
          </Link>{" "}
          to see all your orders in one place.
        </p>
      </div>
    </div>
  );
}
