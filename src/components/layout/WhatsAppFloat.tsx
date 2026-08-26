"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { waLink } from "@/lib/whatsapp";
import { SITE } from "@/lib/site";

/** Floating WhatsApp button with a pulse ring and a nudge tooltip. */
export function WhatsAppFloat() {
  const [showTip, setShowTip] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const t = setTimeout(() => setShowTip(true), 2600);
    const t2 = setTimeout(() => setShowTip(false), 9000);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, []);

  const href = waLink(
    `Hi ${SITE.name}! I saw your website and I'd like to ask about your pieces.`
  );

  return (
    <div className="fixed bottom-5 right-5 z-40 flex items-center gap-3">
      <AnimatePresence>
        {mounted && showTip && (
          <motion.a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, x: 12, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 12, scale: 0.9 }}
            className="hidden sm:block rounded-2xl bg-charcoal px-4 py-2.5 text-sm text-cream shadow-xl"
          >
            Chat with us on WhatsApp
            <span className="absolute -right-1 top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 bg-charcoal" />
          </motion.a>
        )}
      </AnimatePresence>

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        onMouseEnter={() => setShowTip(true)}
        className="relative grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 transition-transform hover:scale-105"
      >
        <span className="absolute inset-0 rounded-full bg-[#25D366] animate-pulse-ring" />
        <svg viewBox="0 0 32 32" className="relative h-7 w-7 fill-current" aria-hidden="true">
          <path d="M16 3C9.4 3 4 8.4 4 15c0 2.1.6 4.2 1.6 6L4 29l8.2-1.6c1.7.9 3.6 1.4 5.6 1.4h.2c6.6 0 12-5.4 12-12S22.6 3 16 3zm0 21.8c-1.7 0-3.4-.5-4.9-1.3l-.4-.2-4.9 1 1-4.8-.3-.4c-.9-1.5-1.4-3.2-1.4-5C4.9 9.6 9.9 4.9 16 4.9c5.6 0 10.2 4.6 10.2 10.2S21.6 24.8 16 24.8zm5.6-7.6c-.3-.2-1.8-.9-2.1-1s-.5-.2-.7.2-.8 1-.9 1.2-.3.2-.6.1c-1.7-.8-2.8-1.5-3.9-3.4-.3-.5.3-.5.8-1.5.1-.2 0-.4 0-.5s-.7-1.7-1-2.3c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.3 5.2 4.6 2 .8 2.7.9 3.7.8.6-.1 1.8-.7 2.1-1.5.3-.7.3-1.4.2-1.5-.1-.2-.3-.3-.6-.4z" />
        </svg>
      </a>
    </div>
  );
}
