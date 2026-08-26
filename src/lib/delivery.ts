/**
 * Delivery zones & policy for Alcove Atelier.
 *
 *  • Nairobi & environs — we deliver ourselves, so **payment on delivery** is
 *    available (the customer pays the rider when the piece arrives).
 *  • Outside Nairobi — the piece goes by courier/parcel service, so the
 *    delivery fee depends on the destination. It is quoted after the order is
 *    placed and settled before dispatch.
 *
 * Client-safe: no server-only imports, so checkout/product pages can use it.
 */

export type DeliveryZoneKey = "nairobi" | "outside";

export type DeliveryZone = {
  key: DeliveryZoneKey;
  label: string;
  /** Short label for tables/pills in the admin. */
  short: string;
  /** One-liner shown under the option at checkout. */
  blurb: string;
  /** How the delivery charge works for this zone. */
  feeNote: string;
  /** Whether "pay on delivery" is offered. */
  payOnDelivery: boolean;
  /** Label + placeholder for the area/town field. */
  areaLabel: string;
  areaPlaceholder: string;
};

export const DELIVERY_ZONES: DeliveryZone[] = [
  {
    key: "nairobi",
    label: "Nairobi & environs",
    short: "Nairobi",
    blurb: "We deliver within Nairobi and the surrounding towns.",
    feeNote:
      "Pay on delivery available — settle up when your order arrives. Any delivery charge is confirmed when we call.",
    payOnDelivery: true,
    areaLabel: "Estate / area",
    areaPlaceholder: "e.g. Kilimani, Ruaka, Syokimau…",
  },
  {
    key: "outside",
    label: "Outside Nairobi",
    short: "Upcountry",
    blurb: "Sent by courier to any town in Kenya.",
    feeNote:
      "Delivery fee depends on your location — we confirm the exact amount with you before dispatch.",
    payOnDelivery: false,
    areaLabel: "Town / City",
    areaPlaceholder: "e.g. Nakuru, Kisumu, Eldoret…",
  },
];

/** Towns/estates we treat as "Nairobi & environs" (used to suggest a zone). */
export const NAIROBI_AREAS = [
  "Nairobi CBD",
  "Westlands",
  "Parklands",
  "Kilimani",
  "Kileleshwa",
  "Lavington",
  "Karen",
  "Langata",
  "South B",
  "South C",
  "Nairobi West",
  "Madaraka",
  "Kasarani",
  "Roysambu",
  "Ruaraka",
  "Eastleigh",
  "Buruburu",
  "Donholm",
  "Embakasi",
  "Utawala",
  "Runda",
  "Muthaiga",
  "Gigiri",
  "Kitisuru",
  "Ridgeways",
  "Ruaka",
  "Kiambu",
  "Ruiru",
  "Juja",
  "Thika",
  "Kikuyu",
  "Kinoo",
  "Rongai",
  "Ngong",
  "Kiserian",
  "Syokimau",
  "Athi River",
  "Kitengela",
  "Mlolongo",
];

export const DEFAULT_ZONE: DeliveryZoneKey = "nairobi";

export function getZone(key: string | null | undefined): DeliveryZone {
  return DELIVERY_ZONES.find((z) => z.key === key) ?? DELIVERY_ZONES[0];
}

export function zoneLabel(key: string | null | undefined): string {
  return getZone(key).label;
}

export function isNairobiZone(key: string | null | undefined): boolean {
  return getZone(key).key === "nairobi";
}

/**
 * Best guess at the zone from a typed town/estate — lets checkout pre-select
 * the right option (the customer can always override it).
 */
export function guessZone(area: string): DeliveryZoneKey | null {
  const a = area.trim().toLowerCase();
  if (a.length < 3) return null;
  if (a.includes("nairobi")) return "nairobi";
  const hit = NAIROBI_AREAS.some((n) => {
    const name = n.toLowerCase();
    return name.includes(a) || a.includes(name);
  });
  return hit ? "nairobi" : null;
}

/** Short policy lines reused across the storefront (product page, cart, footer). */
export const DELIVERY_POLICY = {
  headline: "Delivery across Kenya",
  nairobi:
    "Nairobi & environs: we deliver to your door — pay on delivery available.",
  outside:
    "Outside Nairobi: delivered by courier, with the fee depending on your location (confirmed before dispatch).",
  short:
    "Nairobi & environs — pay on delivery. Outside Nairobi — fee depends on location.",
} as const;
