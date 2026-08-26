/**
 * Central brand + business configuration for Alcove Atelier.
 * Non-secret, client-editable values live here; secrets live in env vars.
 * Contact details marked TODO are placeholders — confirm with the client.
 */

/**
 * The public base URL, used for canonical tags, the sitemap, OG images and
 * payment redirects.
 *
 * Getting this wrong is the most damaging deployment mistake available: every
 * canonical would point at localhost and the whole site would drop out of
 * search. So in production a missing value is shouted about at boot rather
 * than silently falling back.
 */
function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/[/]+$/, "");
  if (configured) return configured;

  // Vercel injects this for preview deployments, which is a sane default there.
  const vercel = process.env.NEXT_PUBLIC_VERCEL_URL || process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;

  if (process.env.NODE_ENV === "production") {
    console.error(
      "[config] NEXT_PUBLIC_SITE_URL is not set. Canonical URLs, the sitemap " +
        "and OG tags will point at localhost, which breaks SEO. Set it in the " +
        "Vercel project environment variables and redeploy."
    );
  }
  return "http://localhost:3000";
}

export const SITE = {
  name: "Alcove Atelier",
  legalName: "Alcove Atelier",
  tagline: "Curated Decor · Creations · Accents",
  shortDesc:
    "Custom-crafted mirrors & bespoke home décor, handmade in Kenya.",
  longDesc:
    "Alcove Atelier designs and hand-makes custom mirrors, throws, cushions, rugs and bath accents — bespoke pieces made to order for beautiful Kenyan homes.",
  // Base URL used for SEO/canonical/OG. Set NEXT_PUBLIC_SITE_URL in production.
  url: siteUrl(),
  locale: "en_KE",
  currency: "KES",
  country: "Kenya",
  city: "Nairobi", // TODO: confirm exact town/area with client

  // --- Contact (TODO: confirm real values with client) ---
  phoneDisplay: "+254 7XX XXX XXX",
  phoneE164: process.env.NEXT_PUBLIC_PHONE || "+2547XXXXXXXX",
  email: process.env.NEXT_PUBLIC_EMAIL || "hello@alcoveatelier.co.ke",

  // WhatsApp: the number in international format WITHOUT the leading "+".
  // From their IG "click to chat" link. Confirm exact number with client.
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "2547XXXXXXXX",
  whatsappShortLink: "https://wa.me/message/U6X3OMPJ7EMXP1",

  socials: {
    instagram: "https://www.instagram.com/alcove_atelier_ke",
    facebook: "", // TODO: add if they have one
    tiktok: "",
    pinterest: "",
  },

  // Manual M-Pesa payment (KCB bank Paybill) shown at checkout.
  mpesa: {
    paybill: "522533",
    account: "8103993",
    businessName: "KEZIAH AND CATHERINE JA",
    bank: "KCB",
  },
} as const;

export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Catalogue", href: "/shop?view=catalogue" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

export type NavLink = (typeof NAV_LINKS)[number];
