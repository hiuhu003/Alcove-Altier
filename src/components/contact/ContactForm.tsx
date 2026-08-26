"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { waLink } from "@/lib/whatsapp";
import { SITE } from "@/lib/site";

export function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const msg = [
      `Hi ${SITE.name}! My name is ${form.name || "(name)"}.`,
      form.email ? `Email: ${form.email}` : null,
      "",
      form.message || "I'd like to enquire about your pieces.",
    ]
      .filter(Boolean)
      .join("\n");
    window.open(waLink(msg), "_blank");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Name</label>
          <input
            value={form.name}
            onChange={set("name")}
            className="h-12 w-full rounded-xl border border-charcoal/15 bg-white/60 px-4 text-sm focus:border-coral focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={set("email")}
            className="h-12 w-full rounded-xl border border-charcoal/15 bg-white/60 px-4 text-sm focus:border-coral focus:outline-none"
          />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Message</label>
        <textarea
          value={form.message}
          onChange={set("message")}
          rows={5}
          placeholder="Tell us about your space or the piece you have in mind…"
          className="w-full rounded-xl border border-charcoal/15 bg-white/60 px-4 py-3 text-sm focus:border-coral focus:outline-none"
        />
      </div>
      <button
        type="submit"
        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-coral font-medium text-white transition-transform hover:scale-[1.01]"
      >
        <Send className="h-4 w-4" /> Send via WhatsApp
      </button>
      <p className="text-center text-xs text-graphite">
        This opens WhatsApp with your message ready to send — the fastest way to reach us.
      </p>
    </form>
  );
}
