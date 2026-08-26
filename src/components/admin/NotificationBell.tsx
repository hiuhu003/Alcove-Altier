"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Bell,
  Check,
  PackageX,
  ShoppingBag,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Alert = {
  id: string;
  type: string;
  level: string;
  title: string;
  body: string;
  href: string | null;
  read: boolean;
  createdAt: string;
};

const POLL_MS = 30_000;

const ICONS: Record<string, typeof Bell> = {
  "order.new": ShoppingBag,
  "order.paid": Wallet,
  "stock.out": PackageX,
  "stock.low": AlertTriangle,
};

const LEVEL_STYLES: Record<string, string> = {
  info: "bg-pink-strong/10 text-pink-strong",
  warning: "bg-amber-100 text-amber-700",
  critical: "bg-coral/15 text-coral",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short" });
}

/**
 * Live alert bell for the admin: new orders, payments received and stock
 * running out. Polls every 30s and pops a toast for orders that land while
 * the admin has the dashboard open.
 */
export function NotificationBell() {
  const router = useRouter();
  const [items, setItems] = useState<Alert[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<Alert | null>(null);
  const seen = useRef<Set<string> | null>(null);
  const panel = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (!data.ok) return;
      const list: Alert[] = data.items;
      setItems(list);
      setUnread(data.unread);

      // First load just records what's already there; after that, anything new
      // and unread that just arrived gets a toast.
      const known = seen.current;
      if (known) {
        const fresh = list.find((a) => !known.has(a.id) && !a.read);
        if (fresh) {
          setToast(fresh);
          setTimeout(() => setToast((t) => (t?.id === fresh.id ? null : t)), 9000);
          // Pull fresh server data into the page behind the toast.
          router.refresh();
        }
      }
      seen.current = new Set(list.map((a) => a.id));
    } catch {
      /* offline / dev reload — try again on the next tick */
    }
  }, [router]);

  useEffect(() => {
    // First poll runs just after paint, then every POLL_MS and on tab focus.
    const first = setTimeout(() => load(), 0);
    const id = setInterval(() => load(), POLL_MS);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      clearTimeout(first);
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  // Close the panel on an outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (panel.current && !panel.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function act(action: string, ids?: string[]) {
    // Optimistic, then reconcile with the server's list.
    if (action === "read-all") {
      setItems((prev) => prev.map((a) => ({ ...a, read: true })));
      setUnread(0);
    }
    if (action === "dismiss-all") {
      setItems([]);
      setUnread(0);
    }
    if (action === "dismiss" && ids) {
      setItems((prev) => prev.filter((a) => !ids.includes(a.id)));
    }
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ids }),
      });
      const data = await res.json();
      if (data.ok) {
        setItems(data.items);
        setUnread(data.unread);
        seen.current = new Set((data.items as Alert[]).map((a) => a.id));
      }
    } catch {
      /* keep the optimistic state */
    }
  }

  function openPanel() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) act("read-all");
  }

  return (
    <>
      <div className="relative" ref={panel}>
        <button
          onClick={openPanel}
          aria-label={`Alerts${unread ? ` (${unread} unread)` : ""}`}
          className={cn(
            "relative grid h-10 w-10 place-items-center rounded-full border transition-colors",
            unread > 0
              ? "border-pink-strong/40 bg-pink-strong/10 text-pink-strong"
              : "border-charcoal/15 text-graphite hover:bg-charcoal/5"
          )}
        >
          <Bell className="h-[18px] w-[18px]" />
          {unread > 0 && (
            <motion.span
              key={unread}
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-pink-strong px-1 text-[11px] font-semibold text-white"
            >
              {unread > 9 ? "9+" : unread}
            </motion.span>
          )}
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-12 z-50 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-charcoal/10 bg-cream shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-charcoal/10 px-4 py-3">
                <h3 className="font-serif text-lg">Alerts</h3>
                {items.length > 0 && (
                  <button
                    onClick={() => act("dismiss-all")}
                    className="flex items-center gap-1 text-xs text-graphite hover:text-coral"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Clear all
                  </button>
                )}
              </div>

              <div className="max-h-[26rem] overflow-y-auto">
                {items.length === 0 ? (
                  <div className="px-4 py-12 text-center text-sm text-graphite">
                    <Check className="mx-auto mb-2 h-6 w-6 text-pink-strong/50" />
                    You&apos;re all caught up.
                  </div>
                ) : (
                  <ul className="divide-y divide-charcoal/5">
                    {items.map((a) => {
                      const Icon = ICONS[a.type] ?? Bell;
                      const inner = (
                        <div className="flex gap-3 px-4 py-3">
                          <span
                            className={cn(
                              "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full",
                              LEVEL_STYLES[a.level] ?? LEVEL_STYLES.info
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium leading-snug">{a.title}</p>
                            {a.body && <p className="mt-0.5 text-xs text-graphite">{a.body}</p>}
                            <p className="mt-1 text-[11px] text-graphite/70">{timeAgo(a.createdAt)}</p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              act("dismiss", [a.id]);
                            }}
                            aria-label="Dismiss"
                            className="h-6 w-6 shrink-0 rounded-full text-graphite/60 hover:bg-charcoal/5 hover:text-charcoal"
                          >
                            <X className="mx-auto h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                      return (
                        <li key={a.id} className={cn(!a.read && "bg-blush/15")}>
                          {a.href ? (
                            <Link href={a.href} onClick={() => setOpen(false)} className="block hover:bg-charcoal/[0.03]">
                              {inner}
                            </Link>
                          ) : (
                            inner
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Toast for alerts that arrive while the admin is looking at the page */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            className="fixed bottom-6 right-6 z-[100] w-[min(22rem,calc(100vw-3rem))] rounded-2xl border border-charcoal/10 bg-cream p-4 shadow-2xl"
          >
            <div className="flex gap-3">
              <span
                className={cn(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-full",
                  LEVEL_STYLES[toast.level] ?? LEVEL_STYLES.info
                )}
              >
                {(() => {
                  const Icon = ICONS[toast.type] ?? Bell;
                  return <Icon className="h-4 w-4" />;
                })()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-snug">{toast.title}</p>
                {toast.body && <p className="mt-0.5 text-xs text-graphite">{toast.body}</p>}
                {toast.href && (
                  <Link
                    href={toast.href}
                    onClick={() => setToast(null)}
                    className="mt-2 inline-block text-xs font-medium text-pink-strong hover:underline"
                  >
                    View →
                  </Link>
                )}
              </div>
              <button
                onClick={() => setToast(null)}
                aria-label="Dismiss"
                className="h-6 w-6 shrink-0 rounded-full text-graphite/60 hover:bg-charcoal/5"
              >
                <X className="mx-auto h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
