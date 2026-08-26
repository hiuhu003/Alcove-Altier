"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  ExternalLink,
  LayoutDashboard,
  Menu,
  Package,
  ShoppingCart,
  Tags,
  Users,
  X,
} from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { LogoutButton } from "./LogoutButton";
import { cn } from "@/lib/utils";

export const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, key: "dashboard" },
  { href: "/admin/products", label: "Products", icon: Package, key: "products" },
  { href: "/admin/categories", label: "Categories", icon: Tags, key: "categories" },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart, key: "orders" },
  { href: "/admin/users", label: "Team", icon: Users, key: "users" },
  { href: "/admin/reports", label: "Reports", icon: BarChart3, key: "reports" },
];

function NavLinks({ active, onNavigate }: { active: string; onNavigate?: () => void }) {
  return (
    <>
      {ADMIN_NAV.map((n) => (
        <Link
          key={n.key}
          href={n.href}
          onClick={onNavigate}
          aria-current={active === n.key ? "page" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors md:py-2.5",
            active === n.key
              ? "bg-pink-strong text-white"
              : "text-graphite hover:bg-charcoal/5"
          )}
        >
          <n.icon className="h-4 w-4 shrink-0" />
          {n.label}
        </Link>
      ))}
    </>
  );
}

/** Sidebar for desktop. Hidden on small screens, where the drawer takes over. */
export function AdminSidebar({ active }: { active: string }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-charcoal/10 bg-cream p-5 md:flex">
      <Link href="/admin" className="mb-8 flex items-center gap-2 px-2">
        <LogoMark className="h-8" />
        <span className="font-serif text-lg">Atelier</span>
      </Link>
      <nav className="flex flex-1 flex-col gap-1">
        <NavLinks active={active} />
      </nav>
      <div className="mt-auto space-y-1 border-t border-charcoal/10 pt-4">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-graphite hover:bg-charcoal/5"
        >
          <ExternalLink className="h-4 w-4" /> View site
        </Link>
        <LogoutButton />
      </div>
    </aside>
  );
}

/**
 * Mobile navigation for the dashboard.
 *
 * The sidebar is desktop-only, which left the admin with no way to move between
 * sections on a phone — you could reach a page from a link and then be stuck.
 * This is the same set of destinations in a drawer.
 */
export function AdminMobileNav({ active }: { active: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close on navigation, and don't let the page scroll behind the drawer.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(true)}
        aria-label="Open admin menu"
        aria-expanded={open}
        className="grid h-10 w-10 place-items-center rounded-full border border-charcoal/15 text-charcoal transition-colors hover:bg-charcoal/5"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/*
        Portalled to <body>. It has to be: this component sits inside the admin
        header, which uses backdrop-blur, and backdrop-filter makes an element a
        containing block for its fixed-position descendants - so
        `fixed inset-y-0` measured the header (about 56px tall) rather than the
        screen, and the panel rendered as a collapsed strip over the page.
        Guarded on `document` rather than mount state: closed, this renders
        nothing on both server and client, so hydration still matches.
      */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setOpen(false)}
                  className="fixed inset-0 z-[100] bg-charcoal/50 backdrop-blur-sm"
                />
                <motion.nav
                  initial={{ x: "-100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-100%" }}
                  transition={{ type: "spring", damping: 30, stiffness: 300 }}
                  aria-label="Admin sections"
                  className="fixed inset-y-0 left-0 z-[110] flex w-[min(17rem,85vw)] flex-col border-r border-charcoal/10 bg-cream p-5"
                >
                  <div className="mb-6 flex items-center justify-between">
                    <Link href="/admin" className="flex items-center gap-2">
                      <LogoMark className="h-8" />
                      <span className="font-serif text-lg">Atelier</span>
                    </Link>
                    <button
                      onClick={() => setOpen(false)}
                      aria-label="Close menu"
                      className="rounded-full p-2 text-graphite hover:bg-charcoal/5"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="flex flex-1 flex-col gap-1 overflow-y-auto">
                    <NavLinks active={active} onNavigate={() => setOpen(false)} />
                  </div>

                  <div className="mt-auto space-y-1 border-t border-charcoal/10 pt-4">
                    <Link
                      href="/"
                      className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-graphite hover:bg-charcoal/5"
                    >
                      <ExternalLink className="h-4 w-4" /> View site
                    </Link>
                    <LogoutButton />
                  </div>
                </motion.nav>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
