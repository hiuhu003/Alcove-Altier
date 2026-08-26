"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutDashboard, LogOut, Package, User as UserIcon } from "lucide-react";
import { useFeedback } from "@/components/ui/Feedback";
import { cn } from "@/lib/utils";

type SessionUser = { name: string; email: string; role: string } | null;

/**
 * Header account control.
 *
 * The session is fetched client-side on purpose: reading cookies during the
 * server render would make every storefront page dynamic and give up ISR. The
 * cost is a brief moment before the menu knows who you are, which is why the
 * signed-out state is the default rather than a spinner.
 */
export function AccountMenu({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useFeedback();
  const [user, setUser] = useState<SessionUser>(null);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Re-check on navigation so signing in/out updates the header immediately.
  useEffect(() => {
    let active = true;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (active) setUser(d.user ?? null);
      })
      .catch(() => {
        /* offline or blocked — stay in the signed-out state */
      });
    return () => {
      active = false;
    };
  }, [pathname]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function signOut() {
    setOpen(false);
    await fetch("/api/auth", { method: "DELETE" }).catch(() => null);
    setUser(null);
    toast.success("Signed out", "See you again soon.");
    router.push("/");
    router.refresh();
  }

  if (!user) {
    return (
      <Link
        href="/signin"
        onClick={onNavigate}
        aria-label="Sign in to your account"
        className="rounded-full p-2.5 transition-colors hover:bg-pink-strong/10 hover:text-pink-strong"
      >
        <UserIcon className="h-[18px] w-[18px]" strokeWidth={1.6} />
      </Link>
    );
  }

  const initial = user.name.trim().charAt(0).toUpperCase() || "A";
  const isAdmin = user.role === "admin";

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${user.name}`}
        className={cn(
          "grid h-9 w-9 place-items-center rounded-full text-sm font-semibold transition-colors",
          open ? "bg-pink-strong text-white" : "bg-blush/50 text-charcoal hover:bg-pink-strong hover:text-white"
        )}
      >
        {initial}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 z-[90] w-60 overflow-hidden rounded-2xl border border-charcoal/10 bg-cream shadow-xl shadow-charcoal/10"
          >
            <div className="border-b border-charcoal/10 px-4 py-3">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-graphite">{user.email}</p>
            </div>
            <div className="p-1.5">
              {isAdmin && (
                <MenuLink href="/admin" icon={LayoutDashboard} onClick={() => setOpen(false)}>
                  Admin dashboard
                </MenuLink>
              )}
              <MenuLink href="/account" icon={Package} onClick={() => setOpen(false)}>
                My orders
              </MenuLink>
              <button
                onClick={signOut}
                role="menuitem"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-graphite transition-colors hover:bg-charcoal/5 hover:text-coral"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuLink({
  href,
  icon: Icon,
  children,
  onClick,
}: {
  href: string;
  icon: typeof Package;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-charcoal/5 hover:text-pink-strong"
    >
      <Icon className="h-4 w-4" />
      {children}
    </Link>
  );
}
