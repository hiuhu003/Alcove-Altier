"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import { ButtonLink } from "@/components/ui/Button";
import { cartTotal, useCart } from "@/store/cart";
import { DELIVERY_POLICY } from "@/lib/delivery";
import { formatKES } from "@/lib/utils";

export function CartDrawer() {
  const { items, isOpen, close, remove, setQty } = useCart();
  const total = cartTotal(items);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-[70] bg-charcoal/40 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 z-[80] flex h-full w-full max-w-md flex-col bg-cream shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-charcoal/10 px-6 py-5">
              <h3 className="font-serif text-xl">Your Selection</h3>
              <button
                onClick={close}
                aria-label="Close cart"
                className="rounded-full p-2 hover:bg-charcoal/5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-sand">
                  <ShoppingBag className="h-7 w-7 text-graphite" strokeWidth={1.4} />
                </div>
                <p className="text-graphite">Your selection is empty.</p>
                <ButtonLink href="/shop" variant="dark" onClick={close}>
                  Browse the shop
                </ButtonLink>
              </div>
            ) : (
              <>
                <div className="flex-1 divide-y divide-charcoal/10 overflow-y-auto px-6">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-4 py-5">
                      <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-sand">
                        <SafeImage
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="80px"
                          className="object-cover"
                          fallbackSeed={item.slug}
                        />
                      </div>
                      <div className="flex flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/shop/${item.slug}`}
                            onClick={close}
                            className="font-serif text-lg leading-tight hover:text-pink-strong"
                          >
                            {item.name}
                          </Link>
                          <button
                            onClick={() => remove(item.id)}
                            aria-label="Remove item"
                            className="text-graphite hover:text-pink-strong"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="mt-0.5 text-xs text-graphite">
                          {[item.size, item.color].filter(Boolean).join(" · ")}
                          {item.bespoke && (
                            <span className="ml-1 text-coral">· Made to order</span>
                          )}
                        </p>
                        <div className="mt-auto flex items-center justify-between pt-2">
                          <div className="flex items-center gap-3 rounded-full border border-charcoal/15 px-2 py-1">
                            <button
                              onClick={() => setQty(item.id, item.qty - 1)}
                              aria-label="Decrease quantity"
                              className="text-graphite hover:text-charcoal"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-5 text-center text-sm">{item.qty}</span>
                            <button
                              onClick={() => setQty(item.id, item.qty + 1)}
                              aria-label="Increase quantity"
                              className="text-graphite hover:text-charcoal"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <span className="text-sm font-medium">
                            {formatKES(item.price * item.qty)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-charcoal/10 px-6 py-5">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-graphite">Subtotal</span>
                    <span className="font-serif text-2xl">{formatKES(total)}</span>
                  </div>
                  <ButtonLink
                    href="/checkout"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={close}
                  >
                    Checkout
                  </ButtonLink>
                  <p className="mt-3 text-center text-xs leading-relaxed text-graphite">
                    {DELIVERY_POLICY.short}
                  </p>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
