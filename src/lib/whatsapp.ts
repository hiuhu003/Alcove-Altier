import { SITE } from "./site";
import { formatKES } from "./utils";
import type { CartItem } from "@/store/cart";

/** Build a wa.me link with a pre-filled message. */
export function waLink(message: string, number = SITE.whatsappNumber): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

/** A single-product enquiry (used on product pages for bespoke items). */
export function productEnquiry(name: string, opts?: { color?: string; size?: string }) {
  const parts = [
    `Hi Alcove Atelier! I'd love to enquire about the *${name}*.`,
    opts?.size ? `Size: ${opts.size}` : null,
    opts?.color ? `Colour: ${opts.color}` : null,
    `Could you share availability and lead time?`,
  ].filter(Boolean);
  return waLink(parts.join("\n"));
}

/** A full cart -> WhatsApp order message (bespoke-friendly checkout). */
export function cartEnquiry(items: CartItem[], total: number, ref: string) {
  const lines = items.map(
    (i) =>
      `• ${i.name}${i.size ? ` — ${i.size}` : ""}${
        i.color ? `, ${i.color}` : ""
      } ×${i.qty} (${formatKES(i.price * i.qty)})`
  );
  const msg = [
    `Hi Alcove Atelier! I'd like to place an order (ref ${ref}):`,
    "",
    ...lines,
    "",
    `Total: ${formatKES(total)}`,
    "",
    `Please confirm availability, lead time and delivery. Thank you!`,
  ].join("\n");
  return waLink(msg);
}
