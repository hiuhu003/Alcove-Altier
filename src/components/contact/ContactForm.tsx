"use client";

import { useEffect, useId, useState } from "react";
import { motion } from "framer-motion";
import { Check, Loader2, Send } from "lucide-react";
import { useSession } from "@/components/auth/SessionProvider";
import { useFeedback } from "@/components/ui/Feedback";
import { waLink } from "@/lib/whatsapp";
import { SITE } from "@/lib/site";

/**
 * Contact form. Sends the note to the shop by email rather than handing the
 * customer off to WhatsApp — a message typed here should arrive without
 * needing a second app, and it leaves the shop a written record.
 *
 * WhatsApp is still offered underneath for anyone who prefers it.
 */
export function ContactForm() {
  const { user } = useSession();
  const { toast } = useFeedback();
  const nameId = useId();
  const emailId = useId();
  const messageId = useId();

  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Signed in? Then we already know who they are — don't make them retype it.
  useEffect(() => {
    if (!user) return;
    setForm((f) => ({
      ...f,
      name: f.name || user.name || "",
      email: f.email || user.email || "",
    }));
  }, [user]);

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "That didn't send. Please try again.");
        setSending(false);
        return;
      }
      setSent(true);
      toast.success("Message sent", "We'll reply to you by email.");
    } catch {
      setError("We couldn't reach the server. Please try WhatsApp instead.");
      setSending(false);
    }
  }

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-blush/30 px-6 py-10 text-center"
      >
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-pink-strong text-white">
          <Check className="h-7 w-7" strokeWidth={2.5} />
        </div>
        <h3 className="mt-5 font-serif text-2xl">Thank you, {form.name.split(" ")[0]}</h3>
        <p className="mt-2 text-sm leading-relaxed text-graphite">
          Your message is with us and we&apos;ll reply to{" "}
          <span className="text-charcoal">{form.email}</span>. We usually come back
          within a working day.
        </p>
        <button
          onClick={() => {
            setSent(false);
            setSending(false);
            setForm((f) => ({ ...f, message: "" }));
          }}
          className="mt-5 text-sm font-medium text-pink-strong underline underline-offset-4"
        >
          Send another message
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={nameId} className="mb-1.5 block text-sm font-medium">
            Name
          </label>
          <input
            id={nameId}
            required
            autoComplete="name"
            value={form.name}
            onChange={set("name")}
            className="h-12 w-full rounded-xl border border-charcoal/15 bg-white/60 px-4 text-sm focus:border-coral focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor={emailId} className="mb-1.5 block text-sm font-medium">
            Email
          </label>
          <input
            id={emailId}
            required
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={set("email")}
            className="h-12 w-full rounded-xl border border-charcoal/15 bg-white/60 px-4 text-sm focus:border-coral focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label htmlFor={messageId} className="mb-1.5 block text-sm font-medium">
          Message
        </label>
        <textarea
          id={messageId}
          required
          rows={5}
          maxLength={4000}
          value={form.message}
          onChange={set("message")}
          placeholder="Tell us about the piece or the space you have in mind…"
          className="w-full rounded-xl border border-charcoal/15 bg-white/60 px-4 py-3 text-sm focus:border-coral focus:outline-none"
        />
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-coral/10 px-4 py-3 text-sm text-charcoal">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={sending}
        className="flex h-13 w-full items-center justify-center gap-2 rounded-full bg-coral py-4 text-sm font-medium tracking-wide text-white transition-colors hover:bg-charcoal disabled:opacity-60"
      >
        {sending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Sending…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" /> Send message
          </>
        )}
      </button>

      <p className="text-center text-xs leading-relaxed text-graphite">
        We&apos;ll reply by email. Prefer to chat?{" "}
        <a
          href={waLink(
            `Hi ${SITE.name}! ${form.message || "I'd like to enquire about your pieces."}`
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="text-charcoal underline underline-offset-2"
        >
          Message us on WhatsApp
        </a>
        .
      </p>
    </form>
  );
}
