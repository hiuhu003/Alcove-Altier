"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, Mail, Plus, Search, Send, ShieldCheck, ShieldOff, X } from "lucide-react";
import { useFeedback } from "@/components/ui/Feedback";
import { cn } from "@/lib/utils";

type Person = {
  id: string;
  name: string;
  email: string;
  role: string;
  orders: number;
  createdAt: string;
};

/**
 * Team & customers.
 *
 * The client can hand a colleague admin access by typing an email and setting a
 * password; the colleague is emailed those details. Someone who already shops
 * here is promoted rather than duplicated.
 */
export function UsersManager() {
  const { toast, confirm } = useFeedback();
  const [people, setPeople] = useState<Person[]>([]);
  const [emailConfigured, setEmailConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [inviting, setInviting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; detail: string } | null>(null);
  const [diagnostics, setDiagnostics] = useState<{
    hint: string;
    present: Record<string, boolean>;
  } | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [usersRes, mailRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/email-test"),
      ]);
      const data = await usersRes.json();
      setPeople(data.users ?? []);
      setEmailConfigured(data.emailConfigured ?? true);

      // Which settings this server can actually see - names only, no values.
      const mail = await mailRes.json().catch(() => null);
      if (mail?.ok) setDiagnostics({ hint: mail.hint, present: mail.present });
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);

  const admins = useMemo(() => people.filter((p) => p.role === "admin"), [people]);
  const customers = useMemo(() => people.filter((p) => p.role !== "admin"), [people]);

  const shown = (list: Person[]) =>
    query
      ? list.filter(
          (p) =>
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.email.toLowerCase().includes(query.toLowerCase())
        )
      : list;

  /** Proves email setup without having to place a real order. */
  async function sendTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/admin/email-test", { method: "POST" });
      const data = await res.json();
      setTestResult({ ok: Boolean(data.ok), detail: data.detail ?? data.error ?? "" });
      if (data.present) setDiagnostics({ hint: data.hint ?? "", present: data.present });
      if (data.ok) {
        toast.success("Test email sent", `Check ${data.to}`);
        setEmailConfigured(true);
      } else {
        toast.error("Test email failed", "See the details below.");
      }
    } catch {
      setTestResult({ ok: false, detail: "Couldn't reach the server." });
    } finally {
      setTesting(false);
    }
  }

  async function revoke(person: Person) {
    const ok = await confirm({
      title: `Remove admin access for ${person.name}?`,
      body: "They'll keep their customer account and order history, but lose access to this dashboard.",
      confirmLabel: "Remove access",
      tone: "danger",
    });
    if (!ok) return;

    const res = await fetch(`/api/admin/users/${person.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      toast.error("Couldn't remove access", data.error ?? "Please try again.");
      return;
    }
    setPeople((prev) =>
      prev.map((p) => (p.id === person.id ? { ...p, role: "customer" } : p))
    );
    toast.success("Admin access removed", person.email);
  }

  return (
    <div>
      {/* Email setup — order confirmations, status updates, review invitations
          and admin invitations all go through here. */}
      <div className="mb-6 rounded-2xl border border-charcoal/10 bg-cream px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 font-medium text-charcoal">
              <Mail className="h-4 w-4 text-pink-strong" />
              Email
              {emailConfigured ? (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  Connected
                </span>
              ) : (
                <span className="rounded-full bg-coral/15 px-2 py-0.5 text-xs font-medium text-coral">
                  Not connected
                </span>
              )}
            </p>
            <p className="mt-1 text-sm text-graphite">
              {emailConfigured
                ? "Order confirmations, delivery updates, review invitations and admin invitations are sent automatically."
                : "Messages are being logged instead of sent. New admins are still created — you'll just need to pass their details on yourself."}
            </p>
            {diagnostics && !emailConfigured && (
              <>
                <p className="mt-2 text-sm text-charcoal">{diagnostics.hint}</p>
                <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  {Object.entries(diagnostics.present).map(([name, set]) => (
                    <li
                      key={name}
                      className={cn(
                        "flex items-center gap-1.5 font-mono text-xs",
                        set ? "text-emerald-700" : "text-graphite"
                      )}
                    >
                      {set ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      {name}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
          <button
            onClick={sendTest}
            disabled={testing}
            className="flex h-10 shrink-0 items-center gap-2 rounded-full border border-charcoal/20 px-4 text-sm transition-colors hover:border-charcoal disabled:opacity-60"
          >
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send me a test
          </button>
        </div>
        {testResult && (
          <p
            className={cn(
              "mt-3 flex items-start gap-2 rounded-xl px-4 py-3 text-sm",
              testResult.ok ? "bg-emerald-50 text-emerald-900" : "bg-coral/10 text-charcoal"
            )}
          >
            {testResult.ok ? (
              <Check className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <X className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <span>{testResult.detail}</span>
          </p>
        )}
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email…"
            className="h-11 w-full rounded-full border border-charcoal/15 bg-cream pl-11 pr-4 text-sm focus:border-pink-strong focus:outline-none"
          />
        </div>
        <button
          onClick={() => setInviting(true)}
          className="flex h-11 items-center gap-2 rounded-full bg-charcoal px-5 text-sm text-cream transition-colors hover:bg-graphite"
        >
          <Plus className="h-4 w-4" /> Add an admin
        </button>
      </div>

      {loading ? (
        <div className="grid place-items-center py-24 text-graphite">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">
          <Section
            title="Admins"
            hint="Full access to products, orders, reports and this page."
            people={shown(admins)}
            empty="No admins yet."
            action={(p) => (
              <button
                onClick={() => revoke(p)}
                className="flex h-9 items-center gap-1.5 rounded-full border border-charcoal/15 px-3 text-sm text-graphite transition-colors hover:border-coral hover:text-coral"
              >
                <ShieldOff className="h-3.5 w-3.5" /> Remove access
              </button>
            )}
          />
          <Section
            title="Customers"
            hint="Shoppers with an account. They can track their orders and check out faster."
            people={shown(customers)}
            empty="No customer accounts yet."
          />
        </div>
      )}

      <AnimatePresence>
        {inviting && (
          <InviteDialog
            onClose={() => setInviting(false)}
            onCreated={(person, emailed, promoted) => {
              setInviting(false);
              setPeople((prev) => {
                const rest = prev.filter((p) => p.id !== person.id);
                return [person, ...rest];
              });
              toast.success(
                promoted ? `${person.name} is now an admin` : `${person.name} added as an admin`,
                emailed
                  ? "Their sign-in details have been emailed to them."
                  : "Email isn't connected — pass the details on yourself."
              );
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function Section({
  title,
  hint,
  people,
  empty,
  action,
}: {
  title: string;
  hint: string;
  people: Person[];
  empty: string;
  action?: (p: Person) => React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3">
        <h2 className="font-serif text-xl">
          {title} <span className="text-graphite">({people.length})</span>
        </h2>
        <p className="text-sm text-graphite">{hint}</p>
      </div>
      {people.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-charcoal/15 py-10 text-center text-sm text-graphite">
          {empty}
        </p>
      ) : (
        <ul className="space-y-2">
          {people.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center gap-3 rounded-2xl border border-charcoal/10 bg-cream px-4 py-3"
            >
              <span
                className={cn(
                  "grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-semibold",
                  p.role === "admin" ? "bg-pink-strong text-white" : "bg-blush/50 text-charcoal"
                )}
              >
                {p.name.trim().charAt(0).toUpperCase() || "?"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{p.name}</p>
                <p className="truncate text-sm text-graphite">{p.email}</p>
              </div>
              <span className="text-sm text-graphite">
                {p.orders} {p.orders === 1 ? "order" : "orders"}
              </span>
              {action?.(p)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function InviteDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (person: Person, emailed: boolean, promoted: boolean) => void;
}) {
  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  /** A password the client doesn't have to invent. */
  function suggestPassword() {
    const words = ["Alcove", "Atelier", "Mirror", "Linen", "Copper", "Nairobi", "Studio"];
    const pick = () => words[Math.floor(Math.random() * words.length)];
    setForm((f) => ({ ...f, password: `${pick()}-${pick()}-${Math.floor(1000 + Math.random() * 9000)}` }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "That didn't work.");
        setSaving(false);
        return;
      }
      onCreated(data.user, data.emailed, data.promoted);
    } catch {
      setError("We couldn't reach the server. Please try again.");
      setSaving(false);
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[130] bg-charcoal/50 backdrop-blur-sm"
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        className="fixed left-1/2 top-1/2 z-[140] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-charcoal/10 bg-cream p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl">Add an admin</h2>
            <p className="mt-1 text-sm text-graphite">
              They&apos;ll be emailed these details and can sign in straight away.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-2 text-graphite hover:bg-charcoal/5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <Field id={nameId} label="Full name" value={form.name} onChange={set("name")} required />
          <Field
            id={emailId}
            label="Email"
            type="email"
            value={form.email}
            onChange={set("email")}
            required
          />
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor={passwordId} className="text-sm font-medium">
                Password
              </label>
              <button
                type="button"
                onClick={suggestPassword}
                className="text-xs text-pink-strong underline underline-offset-2"
              >
                Suggest one
              </button>
            </div>
            <input
              id={passwordId}
              required
              minLength={8}
              value={form.password}
              onChange={set("password")}
              className="h-12 w-full rounded-xl border border-charcoal/15 bg-white/70 px-4 text-sm focus:border-pink-strong focus:outline-none"
            />
            <p className="mt-1 text-xs text-graphite">
              At least 8 characters. They should change it after signing in.
            </p>
          </div>

          {error && (
            <p role="alert" className="rounded-xl bg-coral/10 px-4 py-3 text-sm text-charcoal">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-pink-strong text-sm font-medium text-white transition-colors hover:bg-charcoal disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Creating…
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" /> Give admin access
              </>
            )}
          </button>
          <p className="flex items-center justify-center gap-2 text-xs text-graphite">
            <Mail className="h-3.5 w-3.5" /> We&apos;ll email them the sign-in details.
          </p>
        </form>
      </motion.div>
    </>
  );
}

function Field({
  id,
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { id: string; label: string }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <input
        {...props}
        id={id}
        className="h-12 w-full rounded-xl border border-charcoal/15 bg-white/70 px-4 text-sm focus:border-pink-strong focus:outline-none"
      />
    </div>
  );
}
