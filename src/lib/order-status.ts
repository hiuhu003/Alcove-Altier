/**
 * How an order's progress is described to the customer.
 *
 * The admin works in short internal words (new / confirmed / fulfilled), which
 * mean little to a shopper. This maps them to a plain-language journey, so the
 * same record reads correctly on both sides of the shop. Client-safe — no
 * server-only imports — because the tracking UI is interactive.
 */

export type OrderStatus = "new" | "confirmed" | "fulfilled" | "cancelled";

export type TrackStep = {
  key: Exclude<OrderStatus, "cancelled">;
  label: string;
  /** Shown while this is the current step. */
  description: string;
};

export const TRACK_STEPS: TrackStep[] = [
  {
    key: "new",
    label: "Order received",
    description: "We have your order and will call or WhatsApp you to confirm the details.",
  },
  {
    key: "confirmed",
    label: "Confirmed",
    description:
      "Your order is confirmed and being prepared. Made-to-order pieces are in the workshop.",
  },
  {
    key: "fulfilled",
    label: "Delivered",
    description: "Your order has been delivered. We hope you love it.",
  },
];

export function stepIndex(status: string): number {
  const i = TRACK_STEPS.findIndex((s) => s.key === status);
  return i === -1 ? 0 : i;
}

export function isCancelled(status: string): boolean {
  return status === "cancelled";
}

/** Headline shown at the top of a tracking card. */
export function statusHeadline(status: string): string {
  if (isCancelled(status)) return "Order cancelled";
  return TRACK_STEPS[stepIndex(status)]?.label ?? "Order received";
}

export function statusDescription(status: string): string {
  if (isCancelled(status)) {
    return "This order was cancelled. Message us on WhatsApp if that wasn't expected.";
  }
  return TRACK_STEPS[stepIndex(status)]?.description ?? TRACK_STEPS[0].description;
}

/** What the customer still owes, in words. */
export function paymentLine(order: {
  paymentStatus: string;
  payOnDelivery: boolean;
  channel: string;
}): string {
  if (order.paymentStatus === "paid") return "Paid";
  if (order.paymentStatus === "failed") return "Payment failed";
  if (order.payOnDelivery) return "Pay on delivery";
  if (order.channel === "mpesa") return "Awaiting M-Pesa confirmation";
  if (order.channel === "whatsapp") return "Payment arranged on WhatsApp";
  return "Awaiting payment";
}

export function channelLabel(channel: string): string {
  const map: Record<string, string> = {
    cod: "Pay on delivery",
    whatsapp: "WhatsApp",
    mpesa: "M-Pesa",
    stripe: "Card",
    paypal: "PayPal",
  };
  return map[channel] ?? channel;
}
