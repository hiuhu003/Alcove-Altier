"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  ChevronDown,
  MapPin,
  MessageCircle,
  Phone,
  Search,
  Truck,
  Undo2,
  X,
} from "lucide-react";
import { getZone } from "@/lib/delivery";
import { channelLabel, cn, formatKES } from "@/lib/utils";

type Item = { id: string; name: string; qty: number; price: number; color: string | null; size: string | null };
type Order = {
  id: string;
  ref: string;
  customerName: string;
  email: string;
  phone: string;
  address: string | null;
  city: string | null;
  notes: string | null;
  channel: string;
  paymentStatus: string;
  total: number;
  status: string;
  createdAt: string;
  deliveryZone: string;
  deliveryArea: string | null;
  deliveryFee: number;
  payOnDelivery: boolean;
  items: Item[];
};

const STATUSES = ["new", "confirmed", "fulfilled", "cancelled"] as const;

// One-click "next step" for each status.
const NEXT: Record<string, { to: string; label: string }> = {
  new: { to: "confirmed", label: "Confirm" },
  confirmed: { to: "fulfilled", label: "Mark fulfilled" },
  cancelled: { to: "new", label: "Reopen" },
};

function waCustomerLink(phone: string, ref: string) {
  let p = phone.replace(/\D/g, "");
  if (p.startsWith("0")) p = "254" + p.slice(1);
  if (p.startsWith("7") || p.startsWith("1")) p = "254" + p;
  const msg = `Hi! This is Alcove Atelier regarding your order ${ref}.`;
  return `https://wa.me/${p}?text=${encodeURIComponent(msg)}`;
}

export function OrdersManager({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [open, setOpen] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [query, setQuery] = useState("");

  async function patch(id: string, data: Record<string, string | number>) {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...data } : o)));
    await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length };
    for (const s of STATUSES) c[s] = orders.filter((o) => o.status === s).length;
    return c;
  }, [orders]);

  const shown = useMemo(() => {
    let list = filter === "all" ? orders : orders.filter((o) => o.status === filter);
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        (o) =>
          o.ref.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.phone.includes(q)
      );
    }
    return list;
  }, [orders, filter, query]);

  return (
    <div>
      {/* Toolbar: search + status tabs with counts */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search ref, name or phone…"
            className="h-11 w-full rounded-full border border-charcoal/15 bg-cream pl-11 pr-4 text-sm focus:border-pink-strong focus:outline-none"
          />
        </div>
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        {["all", ...STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              "flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm capitalize transition-colors",
              filter === s ? "border-charcoal bg-charcoal text-cream" : "border-charcoal/15 text-graphite hover:border-charcoal"
            )}
          >
            {s}
            <span
              className={cn(
                "grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px]",
                filter === s ? "bg-cream/20 text-cream" : "bg-charcoal/8 text-graphite"
              )}
            >
              {counts[s] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-charcoal/15 py-20 text-center text-graphite">
          No orders here yet.
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map((o) => {
            const next = NEXT[o.status];
            const isOpen = open === o.id;
            const itemCount = o.items.reduce((n, i) => n + i.qty, 0);
            return (
              <div key={o.id} className="rounded-2xl border border-charcoal/10 bg-cream">
                {/* Main row — all key info + one-click actions, no expand needed */}
                <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center">
                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{o.ref}</span>
                      <StatusPill status={o.status} />
                      <PaymentPill status={o.paymentStatus} />
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-graphite">
                      <span className="truncate">
                        {o.customerName} · {o.phone} · {channelLabel(o.channel)} · {itemCount}{" "}
                        {itemCount === 1 ? "item" : "items"} ·{" "}
                        {new Date(o.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
                      </span>
                      <ZonePill order={o} />
                    </div>
                  </div>

                  <span className="shrink-0 font-serif text-xl lg:w-28 lg:text-right">
                    {formatKES(o.total)}
                  </span>

                  {/* Quick actions */}
                  <div className="flex shrink-0 items-center gap-2">
                    {o.paymentStatus !== "paid" && o.status !== "cancelled" && (
                      <button
                        onClick={() => patch(o.id, { paymentStatus: "paid" })}
                        className="h-9 rounded-full border border-emerald-600/40 px-3 text-sm text-emerald-700 hover:bg-emerald-600 hover:text-white"
                        title="Mark payment received"
                      >
                        Mark paid
                      </button>
                    )}

                    {next && o.status !== "fulfilled" && (
                      <button
                        onClick={() => patch(o.id, { status: next.to })}
                        className={cn(
                          "flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-medium text-white",
                          o.status === "cancelled" ? "bg-graphite hover:bg-charcoal" : "bg-pink-strong hover:bg-charcoal"
                        )}
                      >
                        {o.status === "cancelled" ? <Undo2 className="h-4 w-4" /> : null}
                        {next.label}
                        {o.status !== "cancelled" && <ArrowRight className="h-4 w-4" />}
                      </button>
                    )}
                    {o.status === "fulfilled" && (
                      <span className="flex h-9 items-center gap-1.5 rounded-full bg-emerald-100 px-4 text-sm font-medium text-emerald-700">
                        <Check className="h-4 w-4" /> Done
                      </span>
                    )}

                    <a
                      href={waCustomerLink(o.phone, o.ref)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Message customer on WhatsApp"
                      className="grid h-9 w-9 place-items-center rounded-full border border-charcoal/15 text-[#25D366] hover:bg-[#25D366] hover:text-white"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </a>

                    <button
                      onClick={() => setOpen(isOpen ? null : o.id)}
                      title="Details"
                      className="grid h-9 w-9 place-items-center rounded-full border border-charcoal/15 text-graphite hover:bg-charcoal/5"
                    >
                      <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                    </button>
                  </div>
                </div>

                {/* Expandable details (optional) */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-charcoal/10"
                    >
                      <div className="grid gap-6 p-4 md:grid-cols-2">
                        <div>
                          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-graphite">Items</h4>
                          <ul className="space-y-1.5 text-sm">
                            {o.items.map((it) => (
                              <li key={it.id} className="flex justify-between gap-4">
                                <span>
                                  {it.name}
                                  {it.size ? ` — ${it.size}` : ""}
                                  {it.color ? `, ${it.color}` : ""} ×{it.qty}
                                </span>
                                <span>{formatKES(it.price * it.qty)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="text-sm">
                          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-graphite">Customer</h4>
                          <p>{o.customerName}</p>
                          <p className="flex items-center gap-3 text-graphite">
                            <a href={`mailto:${o.email}`} className="hover:text-coral">{o.email}</a>
                          </p>
                          <p className="flex items-center gap-2 text-graphite">
                            <Phone className="h-3.5 w-3.5" />
                            <a href={`tel:${o.phone}`} className="hover:text-coral">{o.phone}</a>
                          </p>
                          {o.address && <p className="text-graphite">{o.address}, {o.city}</p>}
                          {o.notes && <p className="mt-2 rounded-lg bg-sand px-3 py-2 text-graphite">“{o.notes}”</p>}
                        </div>
                      </div>

                      {/* Delivery — zone decides how the fee & payment work */}
                      <div className="border-t border-charcoal/10 px-4 py-4">
                        <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-graphite">
                          <Truck className="h-3.5 w-3.5" /> Delivery
                        </h4>
                        <div className="flex flex-wrap items-end gap-x-6 gap-y-3 text-sm">
                          <div>
                            <p className="font-medium">{getZone(o.deliveryZone).label}</p>
                            <p className="text-graphite">
                              {o.deliveryArea || o.city || "Area not given"}
                              {o.payOnDelivery && " · pays the rider on delivery"}
                            </p>
                          </div>
                          <DeliveryFee order={o} onSave={(fee) => patch(o.id, { deliveryFee: fee })} />
                          <div className="ml-auto text-right">
                            <p className="text-xs text-graphite">Goods + delivery</p>
                            <p className="font-serif text-xl">{formatKES(o.total + (o.deliveryFee || 0))}</p>
                          </div>
                        </div>
                        <p className="mt-2 text-xs text-graphite">
                          {getZone(o.deliveryZone).feeNote}
                        </p>
                      </div>

                      {/* Jump to any status directly (one click) */}
                      <div className="flex flex-wrap items-center gap-2 border-t border-charcoal/10 px-4 py-3">
                        <span className="text-sm text-graphite">Set status:</span>
                        {STATUSES.map((s) => (
                          <button
                            key={s}
                            onClick={() => patch(o.id, { status: s })}
                            className={cn(
                              "rounded-full border px-3 py-1 text-xs capitalize transition-colors",
                              o.status === s
                                ? "border-charcoal bg-charcoal text-cream"
                                : "border-charcoal/15 text-graphite hover:border-charcoal"
                            )}
                          >
                            {s}
                          </button>
                        ))}
                        {o.status !== "cancelled" && (
                          <button
                            onClick={() => patch(o.id, { status: "cancelled" })}
                            className="ml-auto flex items-center gap-1 text-xs text-coral hover:underline"
                          >
                            <X className="h-3.5 w-3.5" /> Cancel order
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Zone at a glance — pay-on-delivery orders need a call, not a payment link. */
function ZonePill({ order }: { order: Order }) {
  const zone = getZone(order.deliveryZone);
  const nairobi = zone.key === "nairobi";
  return (
    <span
      className={cn(
        "flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs",
        nairobi ? "bg-emerald-50 text-emerald-700" : "bg-charcoal/5 text-graphite"
      )}
      title={zone.feeNote}
    >
      <MapPin className="h-3 w-3" />
      {order.deliveryArea || zone.short}
      {order.payOnDelivery && " · POD"}
      {!nairobi && order.deliveryFee === 0 && " · fee TBC"}
    </span>
  );
}

/** Inline delivery-fee entry — the shop quotes it once they know the location. */
function DeliveryFee({ order, onSave }: { order: Order; onSave: (fee: number) => void }) {
  const [value, setValue] = useState(String(order.deliveryFee || ""));
  const dirty = (Number(value) || 0) !== order.deliveryFee;
  return (
    <div>
      <label className="mb-1 block text-xs text-graphite">Delivery fee (KES)</label>
      <div className="flex items-center gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value.replace(/[^0-9]/g, ""))}
          inputMode="numeric"
          placeholder="0"
          className="h-9 w-28 rounded-full border border-charcoal/15 bg-white/60 px-3 text-sm focus:border-pink-strong focus:outline-none"
        />
        <button
          onClick={() => onSave(Number(value) || 0)}
          disabled={!dirty}
          className={cn(
            "h-9 rounded-full px-3 text-sm",
            dirty
              ? "bg-charcoal text-cream hover:bg-pink-strong"
              : "cursor-default border border-charcoal/10 text-graphite/50"
          )}
        >
          {dirty ? "Save" : "Saved"}
        </button>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    new: "bg-blush/40 text-charcoal",
    confirmed: "bg-pink-strong/15 text-pink-strong",
    fulfilled: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-charcoal/10 text-graphite",
  };
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium capitalize", map[status] ?? "bg-charcoal/10")}>
      {status}
    </span>
  );
}

function PaymentPill({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs capitalize",
        status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-blush/40 text-charcoal"
      )}
    >
      {status === "paid" ? "paid" : "unpaid"}
    </span>
  );
}
