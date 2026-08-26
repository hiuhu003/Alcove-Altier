import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes with conflict resolution. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as Kenyan Shillings, e.g. 4500 -> "KSh 4,500". */
export function formatKES(amount: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace("KES", "KSh")
    .replace("Ksh", "KSh");
}

/** URL/id-safe slug from a string. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Display names for the order channels stored on Order.channel. */
export const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  mpesa: "M-Pesa",
  stripe: "Card",
  paypal: "PayPal",
  cod: "Pay on delivery",
};

export function channelLabel(channel: string): string {
  return CHANNEL_LABELS[channel] ?? channel;
}

/** Human-friendly order reference, e.g. AA-7F3K9. */
export function orderRef(seed: string): string {
  const base = seed.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return `AA-${base.slice(-5).padStart(5, "0")}`;
}
