"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, MapPin, ShieldCheck, Smartphone, Truck } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import { Button, ButtonLink } from "@/components/ui/Button";
import { PaybillInstructions } from "@/components/checkout/PaybillInstructions";
import { cartTotal, useCart } from "@/store/cart";
import { cartEnquiry } from "@/lib/whatsapp";
import { SITE } from "@/lib/site";
import {
  DELIVERY_ZONES,
  NAIROBI_AREAS,
  getZone,
  guessZone,
  type DeliveryZoneKey,
} from "@/lib/delivery";
import { cn, formatKES } from "@/lib/utils";

type Method = "whatsapp" | "mpesa" | "cod";

const methods: { key: Method; label: string; hint: string; nairobiOnly?: boolean }[] = [
  {
    key: "cod",
    label: "Pay on delivery",
    hint: "Nairobi & environs — pay cash or M-Pesa when your order arrives",
    nairobiOnly: true,
  },
  { key: "whatsapp", label: "WhatsApp", hint: "Best for bespoke — confirm details & terms with us first" },
  { key: "mpesa", label: "M-Pesa", hint: `Pay to our ${SITE.mpesa.bank} Paybill & enter the code` },
];

export function CheckoutClient() {
  const router = useRouter();
  const { items, clear } = useCart();
  const total = cartTotal(items);
  const hasBespoke = useMemo(() => items.some((i) => i.bespoke), [items]);

  const [method, setMethod] = useState<Method>("cod");
  const [zoneKey, setZoneKey] = useState<DeliveryZoneKey>("nairobi");
  const [zonePicked, setZonePicked] = useState(false);
  const [form, setForm] = useState({
    customerName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    notes: "",
  });
  const [mpesaCode, setMpesaCode] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryable, setRetryable] = useState(false);

  const zone = getZone(zoneKey);

  // Prefill from the signed-in account so returning customers don't retype
  // their details. Anything already typed is left alone.
  useEffect(() => {
    let active = true;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!active || !d.user) return;
        setSignedIn(true);
        setForm((f) => ({
          ...f,
          customerName: f.customerName || d.user.name || "",
          email: f.email || d.user.email || "",
          phone: f.phone || d.user.phone || "",
        }));
      })
      .catch(() => {
        /* guest checkout - nothing to prefill */
      });
    return () => {
      active = false;
    };
  }, []);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  /** Typing a town we recognise suggests the zone — until they pick one. */
  function onAreaChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setForm((f) => ({ ...f, city: value }));
    if (zonePicked) return;
    const guess = guessZone(value);
    if (guess && guess !== zoneKey) setZoneKey(guess);
  }

  /** Pay on delivery only exists where we deliver ourselves. */
  function pickZone(key: DeliveryZoneKey) {
    setZoneKey(key);
    setZonePicked(true);
    if (!getZone(key).payOnDelivery && method === "cod") setMethod("whatsapp");
  }

  async function createOrder(payMethod: Method = method) {
    // For manual M-Pesa, record the Paybill + confirmation code in the notes so
    // the business can reconcile the payment from the admin dashboard.
    const paybillNote =
      payMethod === "mpesa"
        ? `\n[M-Pesa Paybill ${SITE.mpesa.paybill}, Acc ${SITE.mpesa.account}${
            mpesaCode ? ` · Code: ${mpesaCode}` : " · code pending"
          }]`
        : "";
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        notes: `${form.notes}${paybillNote}`.trim(),
        channel: payMethod,
        deliveryZone: zoneKey,
        deliveryArea: form.city,
        items: items.map((i) => ({
          productId: i.productId,
          name: i.name,
          color: i.color,
          size: i.size,
          price: i.price,
          qty: i.qty,
        })),
      }),
    });
    const data = await res.json();
    if (!data.ok) {
      setRetryable(Boolean(data.retryable));
      throw new Error(data.error || "Could not create order");
    }
    return data.ref as string;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setRetryable(false);
    if (!form.customerName || !form.email || !form.phone) {
      setError("Please fill in your name, email and phone.");
      return;
    }
    if (!form.city.trim()) {
      setError(
        zone.key === "nairobi"
          ? "Please tell us the estate/area we're delivering to."
          : "Please tell us the town we're delivering to so we can quote the delivery fee."
      );
      return;
    }
    // The zone picker already swaps away from pay-on-delivery when you leave
    // Nairobi, but never send a combination the server will refuse.
    const payMethod: Method = method === "cod" && !zone.payOnDelivery ? "whatsapp" : method;
    if (payMethod !== method) setMethod(payMethod);

    setLoading(true);
    try {
      const ref = await createOrder(payMethod);

      if (payMethod === "cod") {
        // Payment happens at the door — we just confirm the order and call.
        clear();
        router.push(`/checkout/success?ref=${ref}&method=cod`);
        return;
      }

      if (payMethod === "whatsapp") {
        const link = cartEnquiry(items, total, ref);
        clear();
        window.open(link, "_blank");
        router.push(`/checkout/success?ref=${ref}&method=whatsapp`);
        return;
      }

      // Manual M-Pesa Paybill payment — the order is placed and we reconcile
      // the payment (by code / SMS) from the admin dashboard.
      clear();
      router.push(`/checkout/success?ref=${ref}&method=mpesa&pending=1`);
    } catch (err) {
      // A network failure never reaches the API, so it is always worth retrying.
      if (err instanceof TypeError) setRetryable(true);
      setError(
        err instanceof Error && err.message
          ? err.message
          : "We couldn't reach the server. Check your connection and try again."
      );
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="container-x grid min-h-[60vh] place-items-center pt-[var(--header-h)] text-center">
        <div>
          <h1 className="font-serif text-4xl">Your selection is empty</h1>
          <p className="mt-3 text-graphite">Add a few pieces before checking out.</p>
          <ButtonLink href="/shop" variant="dark" size="lg" className="mt-6">
            Browse the shop
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="container-x pb-24 pt-[calc(var(--header-h)+2rem)]">
      <h1 className="mb-10 font-serif text-4xl sm:text-5xl">Checkout</h1>

      <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr]">
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-10">
          {!signedIn && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-charcoal/10 bg-white/50 px-5 py-4">
              <p className="text-sm text-graphite">
                Have an account? Sign in to fill this in automatically.
              </p>
              <Link
                href="/signin?next=/checkout"
                className="text-sm font-medium text-pink-strong underline underline-offset-4"
              >
                Sign in
              </Link>
            </div>
          )}

          <section>
            <h2 className="mb-5 font-serif text-2xl">Your details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" required value={form.customerName} onChange={set("customerName")} />
              <Field label="Phone" required value={form.phone} onChange={set("phone")} placeholder="07XX XXX XXX" />
              <Field label="Email" required type="email" value={form.email} onChange={set("email")} className="sm:col-span-2" />
              <Field label="Delivery address" value={form.address} onChange={set("address")} />
              <Field
                label={zone.areaLabel}
                required
                value={form.city}
                onChange={onAreaChange}
                placeholder={zone.areaPlaceholder}
                list={zone.key === "nairobi" ? "nairobi-areas" : undefined}
              />
              {zone.key === "nairobi" && (
                <datalist id="nairobi-areas">
                  {NAIROBI_AREAS.map((a) => (
                    <option key={a} value={a} />
                  ))}
                </datalist>
              )}
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium">Notes (optional)</label>
                <textarea
                  value={form.notes}
                  onChange={set("notes")}
                  rows={3}
                  placeholder="Colour preferences, custom sizing, delivery instructions…"
                  className="w-full rounded-xl border border-charcoal/15 bg-white/60 px-4 py-3 text-sm focus:border-pink-strong focus:outline-none"
                />
              </div>
            </div>
          </section>

          {/* Delivery zone — decides pay-on-delivery & how the fee is worked out */}
          <section>
            <h2 className="mb-1 font-serif text-2xl">Delivery</h2>
            <p className="mb-4 text-sm text-graphite">Where are we delivering to?</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {DELIVERY_ZONES.map((z) => (
                <button
                  type="button"
                  key={z.key}
                  onClick={() => pickZone(z.key)}
                  className={cn(
                    "rounded-2xl border p-4 text-left transition-all",
                    zoneKey === z.key
                      ? "border-pink-strong bg-pink-strong/10 shadow-sm"
                      : "border-charcoal/15 hover:border-charcoal/40"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 font-medium">
                      <MapPin className="h-4 w-4 text-pink-strong" />
                      {z.label}
                    </span>
                    <span
                      className={cn(
                        "grid h-5 w-5 place-items-center rounded-full border",
                        zoneKey === z.key ? "border-pink-strong bg-pink-strong" : "border-charcoal/30"
                      )}
                    >
                      {zoneKey === z.key && <span className="h-2 w-2 rounded-full bg-white" />}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-graphite">{z.blurb}</p>
                </button>
              ))}
            </div>
            <p className="mt-3 flex items-start gap-2 rounded-xl bg-sand px-4 py-3 text-sm text-graphite">
              <Truck className="mt-0.5 h-4 w-4 shrink-0 text-pink-strong" />
              <span>{zone.feeNote}</span>
            </p>
          </section>

          <section>
            <h2 className="mb-1 font-serif text-2xl">Payment method</h2>
            {hasBespoke && (
              <p className="mb-4 rounded-lg bg-pink-strong/10 px-4 py-2 text-sm text-charcoal">
                Your selection includes made-to-order pieces — we recommend
                <strong> WhatsApp</strong> so we can confirm details & lead time first.
              </p>
            )}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {methods
                .filter((m) => !m.nairobiOnly || zone.payOnDelivery)
                .map((m) => (
                  <button
                    type="button"
                    key={m.key}
                    onClick={() => setMethod(m.key)}
                    className={cn(
                      "rounded-2xl border p-4 text-left transition-all",
                      method === m.key
                        ? "border-pink-strong bg-pink-strong/10 shadow-sm"
                        : "border-charcoal/15 hover:border-charcoal/40"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{m.label}</span>
                      <span
                        className={cn(
                          "grid h-5 w-5 place-items-center rounded-full border",
                          method === m.key ? "border-pink-strong bg-pink-strong" : "border-charcoal/30"
                        )}
                      >
                        {method === m.key && <span className="h-2 w-2 rounded-full bg-white" />}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-graphite">{m.hint}</p>
                  </button>
                ))}
            </div>

            {method === "mpesa" && (
              <div className="mt-4">
                <PaybillInstructions amount={total} code={mpesaCode} onCode={setMpesaCode} />
              </div>
            )}
          </section>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              role="alert"
              className="rounded-xl bg-coral/10 px-4 py-3 text-sm text-charcoal"
            >
              <p>{error}</p>
              {retryable && (
                <a
                  href={cartEnquiry(items, total, "(new order)")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-2 font-medium text-charcoal underline underline-offset-4"
                >
                  Send this order on WhatsApp instead
                </a>
              )}
            </motion.div>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Processing…
              </>
            ) : method === "cod" ? (
              <>Place order · pay {formatKES(total)} on delivery</>
            ) : method === "whatsapp" ? (
              <>Place order on WhatsApp · {formatKES(total)}</>
            ) : (
              <>I&apos;ve paid — place order · {formatKES(total)}</>
            )}
          </Button>

          <p className="flex items-center justify-center gap-2 text-xs text-graphite">
            <ShieldCheck className="h-4 w-4 text-pink-strong" /> Your details are kept private and used only to fulfil your order.
          </p>
        </form>

        {/* Summary */}
        <aside className="lg:pl-4">
          <div className="sticky top-[calc(var(--header-h)+1.5rem)] rounded-3xl border border-charcoal/10 bg-white/50 p-6">
            <h2 className="mb-5 font-serif text-2xl">Order summary</h2>
            <div className="max-h-72 space-y-4 overflow-y-auto pr-1">
              {items.map((i) => (
                <div key={i.id} className="flex gap-3">
                  <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-sand">
                    <SafeImage src={i.image} alt={i.name} fill sizes="56px" fallbackSeed={i.slug} className="object-cover" />
                  </div>
                  <div className="flex flex-1 flex-col text-sm">
                    <span className="font-medium leading-tight">{i.name}</span>
                    <span className="text-xs text-graphite">
                      {[i.size, i.color].filter(Boolean).join(" · ")} · ×{i.qty}
                    </span>
                    <span className="mt-auto">{formatKES(i.price * i.qty)}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 space-y-2 border-t border-charcoal/10 pt-5 text-sm">
              <div className="flex justify-between text-graphite">
                <span>Subtotal</span>
                <span>{formatKES(total)}</span>
              </div>
              <div className="flex justify-between gap-4 text-graphite">
                <span>Delivery</span>
                <span className="text-right">
                  {zone.key === "nairobi" ? "Nairobi & environs" : "Quoted by location"}
                </span>
              </div>
              <div className="flex justify-between pt-2 font-serif text-2xl text-charcoal">
                <span>Total</span>
                <span>{formatKES(total)}</span>
              </div>
            </div>
            <p className="mt-3 rounded-xl bg-sand px-3 py-2 text-xs leading-relaxed text-graphite">
              {zone.feeNote}
            </p>
            <Link href="/shop" className="mt-5 block text-center text-sm text-pink-strong underline underline-offset-4">
              Continue shopping
            </Link>
            <div className="mt-5 flex items-center justify-center gap-2 text-graphite/70">
              <Smartphone className="h-4 w-4" />
              <span className="text-xs">M-Pesa · WhatsApp · Pay on delivery in Nairobi</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({
  label,
  className,
  required,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  // Tie the label to the input so clicking it focuses the field (and screen
  // readers announce it).
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label} {required && <span className="text-pink-strong">*</span>}
      </label>
      <input
        {...props}
        id={id}
        required={required}
        className="h-12 w-full rounded-xl border border-charcoal/15 bg-white/60 px-4 text-sm focus:border-pink-strong focus:outline-none"
      />
    </div>
  );
}
