"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, ChevronDown, MessageCircle, Truck, X } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import { cn, formatKES } from "@/lib/utils";
import {
  TRACK_STEPS,
  channelLabel,
  isCancelled,
  paymentLine,
  statusDescription,
  stepIndex,
} from "@/lib/order-status";
import { zoneLabel } from "@/lib/delivery";
import { waLink } from "@/lib/whatsapp";

export type TrackedOrder = {
  ref: string;
  status: string;
  paymentStatus: string;
  channel: string;
  payOnDelivery: boolean;
  total: number;
  deliveryFee: number;
  deliveryZone: string;
  deliveryArea: string | null;
  address: string | null;
  createdAt: string;
  items: {
    id: string;
    name: string;
    qty: number;
    price: number;
    color: string | null;
    size: string | null;
    image?: string | null;
    slug?: string | null;
  }[];
};

/**
 * The customer-facing view of one order: where it is, what is in it, and what
 * is still owed. Used on the account page and the guest tracking page.
 */
export function OrderTracker({
  order,
  defaultOpen = false,
}: {
  order: TrackedOrder;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const cancelled = isCancelled(order.status);
  const current = stepIndex(order.status);
  const itemCount = order.items.reduce((n, i) => n + i.qty, 0);
  const grandTotal = order.total + (order.deliveryFee || 0);

  return (
    <div className="overflow-hidden rounded-3xl border border-charcoal/10 bg-white/60">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-charcoal/10 px-5 py-4 sm:px-6">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{order.ref}</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium",
                cancelled
                  ? "bg-charcoal/10 text-graphite"
                  : order.status === "fulfilled"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-blush/40 text-charcoal"
              )}
            >
              {cancelled ? "Cancelled" : TRACK_STEPS[current].label}
            </span>
            <span className="rounded-full bg-sand px-2 py-0.5 text-xs text-graphite">
              {paymentLine(order)}
            </span>
          </div>
          <p className="mt-1 text-sm text-graphite">
            {new Date(order.createdAt).toLocaleDateString("en-KE", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}{" "}
            · {itemCount} {itemCount === 1 ? "item" : "items"} · {channelLabel(order.channel)}
          </p>
        </div>
        <span className="font-serif text-xl">{formatKES(grandTotal)}</span>
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="grid h-9 w-9 place-items-center rounded-full border border-charcoal/15 text-graphite transition-colors hover:bg-charcoal/5"
          aria-label={open ? "Hide order details" : "Show order details"}
        >
          <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
        </button>
      </div>

      {/* Progress */}
      <div className="px-5 py-6 sm:px-6">
        {cancelled ? (
          <div className="flex items-start gap-3 rounded-2xl bg-charcoal/5 px-4 py-3">
            <X className="mt-0.5 h-4 w-4 shrink-0 text-graphite" />
            <p className="text-sm text-graphite">{statusDescription(order.status)}</p>
          </div>
        ) : (
          <>
            <ol className="flex items-start">
              {TRACK_STEPS.map((step, i) => {
                const done = i <= current;
                const isLast = i === TRACK_STEPS.length - 1;
                return (
                  <li key={step.key} className={cn("flex flex-1 flex-col", !isLast && "pr-1")}>
                    <div className="flex items-center">
                      <motion.span
                        initial={false}
                        animate={{ scale: i === current ? [1, 1.12, 1] : 1 }}
                        transition={{ duration: 0.5 }}
                        className={cn(
                          "grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 text-xs font-semibold",
                          done
                            ? "border-pink-strong bg-pink-strong text-white"
                            : "border-charcoal/20 bg-cream text-graphite"
                        )}
                      >
                        {done ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
                      </motion.span>
                      {!isLast && (
                        <span
                          className={cn(
                            "ml-1 h-0.5 flex-1 rounded-full",
                            i < current ? "bg-pink-strong" : "bg-charcoal/15"
                          )}
                        />
                      )}
                    </div>
                    <span
                      className={cn(
                        "mt-2 text-xs leading-tight sm:text-sm",
                        done ? "font-medium text-charcoal" : "text-graphite"
                      )}
                    >
                      {step.label}
                    </span>
                  </li>
                );
              })}
            </ol>
            <p className="mt-4 text-sm leading-relaxed text-graphite">
              {statusDescription(order.status)}
            </p>
          </>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          <a
            href={waLink(
              `Hi Alcove Atelier! I'd like an update on my order ${order.ref}.`
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 items-center gap-2 rounded-full border border-charcoal/15 px-4 text-sm transition-colors hover:border-charcoal"
          >
            <MessageCircle className="h-4 w-4 text-[#25D366]" />
            Ask about this order
          </a>
        </div>
      </div>

      {/* Details */}
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="overflow-hidden border-t border-charcoal/10"
        >
          <div className="grid gap-6 px-5 py-5 sm:px-6 md:grid-cols-2">
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-graphite">
                Items
              </h3>
              <ul className="space-y-3">
                {order.items.map((item) => (
                  <li key={item.id} className="flex gap-3">
                    {item.image && (
                      <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-lg bg-sand">
                        <SafeImage
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="48px"
                          fallbackSeed={item.slug ?? item.name}
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 text-sm">
                      <p className="font-medium leading-tight">{item.name}</p>
                      <p className="text-xs text-graphite">
                        {[item.size, item.color].filter(Boolean).join(" · ")}
                        {[item.size, item.color].filter(Boolean).length > 0 ? " · " : ""}×
                        {item.qty}
                      </p>
                    </div>
                    <span className="text-sm">{formatKES(item.price * item.qty)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="text-sm">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-graphite">
                Delivery
              </h3>
              <p className="flex items-start gap-2 text-graphite">
                <Truck className="mt-0.5 h-4 w-4 shrink-0 text-pink-strong" />
                <span>
                  {zoneLabel(order.deliveryZone)}
                  {order.deliveryArea ? ` · ${order.deliveryArea}` : ""}
                  {order.address ? <><br />{order.address}</> : null}
                </span>
              </p>

              <dl className="mt-4 space-y-1.5 border-t border-charcoal/10 pt-4">
                <div className="flex justify-between">
                  <dt className="text-graphite">Items</dt>
                  <dd>{formatKES(order.total)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-graphite">Delivery</dt>
                  <dd>
                    {order.deliveryFee > 0
                      ? formatKES(order.deliveryFee)
                      : order.deliveryZone === "nairobi"
                        ? "Confirmed on the call"
                        : "Quoted before dispatch"}
                  </dd>
                </div>
                <div className="flex justify-between pt-1 font-medium">
                  <dt>Total</dt>
                  <dd>{formatKES(grandTotal)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
