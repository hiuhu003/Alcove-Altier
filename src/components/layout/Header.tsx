"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { NAV_LINKS } from "@/lib/site";
import { cartCount, useCart } from "@/store/cart";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const items = useCart((s) => s.items);
  const openCart = useCart((s) => s.open);
  const count = cartCount(items);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => setMenuOpen(false), [pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href.split("?")[0]);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-500",
          scrolled
            ? "bg-cream/80 backdrop-blur-xl shadow-[0_1px_0_rgba(0,0,0,0.06)]"
            : "bg-transparent"
        )}
      >
        <div className="container-x flex items-center justify-between gap-4 h-[var(--header-h)]">
          <Link href="/" aria-label="Alcove Atelier home" className="shrink-0">
            <Logo className={cn("transition-all", scrolled ? "scale-95" : "scale-100")} />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                data-active={isActive(link.href)}
                className="nav-link text-sm tracking-wide text-charcoal/80 hover:text-pink-strong data-[active=true]:text-pink-strong"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/shop"
              aria-label="Search the shop"
              className="p-2.5 rounded-full hover:bg-pink-strong/10 hover:text-pink-strong transition-colors"
            >
              <Search className="h-[18px] w-[18px]" strokeWidth={1.6} />
            </Link>
            <button
              onClick={openCart}
              aria-label="Open cart"
              className="relative p-2.5 rounded-full hover:bg-pink-strong/10 hover:text-pink-strong transition-colors"
            >
              <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.6} />
              <AnimatePresence>
                {count > 0 && (
                  <motion.span
                    key={count}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-0.5 -right-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-pink-strong px-1 text-[10px] font-semibold text-white"
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="md:hidden p-2.5 rounded-full hover:bg-pink-strong/10 hover:text-pink-strong transition-colors"
            >
              <Menu className="h-5 w-5" strokeWidth={1.6} />
            </button>
          </div>
        </div>
        {/* Pink accent line that fades in on scroll */}
        <span
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-pink-strong to-transparent transition-opacity duration-500",
            scrolled ? "opacity-100" : "opacity-0"
          )}
        />
      </header>

      {/* Mobile full-screen menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-cream md:hidden"
          >
            <div className="container-x flex h-[var(--header-h)] items-center justify-between">
              <Logo />
              <button
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="p-2.5 rounded-full hover:bg-charcoal/5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="container-x mt-8 flex flex-col gap-2">
              {NAV_LINKS.map((link, i) => (
                <motion.div
                  key={link.label}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.08 + i * 0.06 }}
                >
                  <Link
                    href={link.href}
                    className="block border-b border-charcoal/10 py-4 font-serif text-3xl text-charcoal"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
