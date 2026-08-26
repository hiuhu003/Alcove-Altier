"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Lock, Mail, Phone, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useFeedback } from "@/components/ui/Feedback";
import { cn } from "@/lib/utils";

/**
 * Sign in / create account. One component for both so the two screens stay
 * visually identical and the toggle between them keeps whatever was typed.
 *
 * Admins use this same form — the server decides where they land based on
 * their role, so there is no separate admin URL to remember.
 */
export function AuthForm({
  mode,
  redirectTo,
}: {
  mode: "signin" | "signup";
  redirectTo?: string;
}) {
  const router = useRouter();
  const { toast } = useFeedback();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSignUp = mode === "signup";
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: isSignUp ? "signup" : "signin", ...form }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "That didn't work. Please try again.");
        setLoading(false);
        return;
      }

      toast.success(
        isSignUp ? `Welcome, ${data.user.name.split(" ")[0]}` : `Welcome back, ${data.user.name.split(" ")[0]}`,
        data.user.role === "admin" ? "Opening your dashboard" : undefined
      );

      // An explicit ?next= wins, then the role-based landing page.
      const destination = redirectTo || data.redirect || "/account";
      router.push(destination);
      router.refresh();
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <div className="container-x grid min-h-[70vh] place-items-center py-20 pt-[calc(var(--header-h)+2rem)]">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="rounded-3xl border border-charcoal/10 bg-white/60 p-7 sm:p-9">
          <h1 className="font-serif text-3xl sm:text-4xl">
            {isSignUp ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-graphite">
            {isSignUp
              ? "Save your details, follow your orders and reorder in a couple of taps."
              : "Sign in to track your orders and check out faster."}
          </p>

          <form onSubmit={onSubmit} className="mt-7 space-y-4">
            {isSignUp && (
              <AuthField
                label="Full name"
                icon={User}
                value={form.name}
                onChange={set("name")}
                autoComplete="name"
                required
              />
            )}
            <AuthField
              label="Email"
              icon={Mail}
              type="email"
              value={form.email}
              onChange={set("email")}
              autoComplete="email"
              required
            />
            {isSignUp && (
              <AuthField
                label="Phone (optional)"
                icon={Phone}
                value={form.phone}
                onChange={set("phone")}
                autoComplete="tel"
                placeholder="07XX XXX XXX"
              />
            )}
            <AuthField
              label="Password"
              icon={Lock}
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={set("password")}
              autoComplete={isSignUp ? "new-password" : "current-password"}
              required
              hint={isSignUp ? "At least 8 characters" : undefined}
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="text-graphite transition-colors hover:text-charcoal"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                role="alert"
                className="rounded-xl bg-coral/10 px-4 py-3 text-sm text-charcoal"
              >
                {error}
              </motion.p>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isSignUp ? "Creating account…" : "Signing in…"}
                </>
              ) : isSignUp ? (
                "Create account"
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-graphite">
            {isSignUp ? "Already have an account? " : "New here? "}
            <Link
              href={isSignUp ? "/signin" : "/signup"}
              className="font-medium text-pink-strong underline underline-offset-4"
            >
              {isSignUp ? "Sign in" : "Create an account"}
            </Link>
          </p>
        </div>

        <p className="mt-5 text-center text-xs leading-relaxed text-graphite">
          You don&apos;t need an account to order — you can{" "}
          <Link href="/shop" className="underline underline-offset-2">
            shop as a guest
          </Link>{" "}
          and track your order with its reference.
        </p>
      </motion.div>
    </div>
  );
}

function AuthField({
  label,
  icon: Icon,
  hint,
  trailing,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon: typeof Mail;
  hint?: string;
  trailing?: React.ReactNode;
}) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite" />
        <input
          {...props}
          id={id}
          className={cn(
            "h-12 w-full rounded-xl border border-charcoal/15 bg-white/70 pl-11 pr-11 text-sm",
            "focus:border-pink-strong focus:outline-none"
          )}
        />
        {trailing && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2">{trailing}</span>
        )}
      </div>
      {hint && <p className="mt-1 text-xs text-graphite">{hint}</p>}
    </div>
  );
}
