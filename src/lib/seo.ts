import type { Metadata } from "next";
import { SITE } from "./site";
import { DELIVERY_POLICY } from "./delivery";
import type { Product } from "./types";

const url = SITE.url;

export const baseMetadata: Metadata = {
  metadataBase: new URL(url),
  title: {
    default: `${SITE.name} — Custom Mirrors & Bespoke Home Décor in Kenya`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.longDesc,
  applicationName: SITE.name,
  keywords: [
    "custom mirrors Kenya",
    "bespoke home decor Nairobi",
    "arch mirror Nairobi",
    "throw blankets Kenya",
    "cushion covers Nairobi",
    "rugs and carpets Kenya",
    "bean bags Kenya",
    "home decor delivery Nairobi",
    "Alcove Atelier",
  ],
  authors: [{ name: SITE.name, url }],
  creator: SITE.name,
  publisher: SITE.name,
  category: "Home & Garden",
  alternates: { canonical: "/" },
  formatDetection: { telephone: true, address: false, email: true },
  openGraph: {
    type: "website",
    locale: SITE.locale,
    url,
    siteName: SITE.name,
    title: `${SITE.name} — Curated Decor · Creations · Accents`,
    description: SITE.longDesc,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.name,
    description: SITE.shortDesc,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: { icon: "/favicon.ico", apple: "/favicon.ico" },
  // Search Console / Bing ownership — set these env vars when the client verifies.
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
      ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION }
      : undefined,
  },
};

/** Absolute URL for a possibly-relative path (structured data needs absolute). */
export function absoluteUrl(path: string): string {
  if (!path) return url;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${url}${path.startsWith("/") ? "" : "/"}${path}`;
}

/**
 * The store itself. Emitted once, in the root layout.
 * The @id lets the Product/Breadcrumb graphs reference this entity instead of
 * repeating it, which is what Google prefers for multi-entity pages.
 */
export function localBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "HomeGoodsStore",
    "@id": `${url}/#store`,
    name: SITE.name,
    alternateName: SITE.tagline,
    description: SITE.longDesc,
    url,
    image: absoluteUrl("/opengraph-image"),
    logo: absoluteUrl("/opengraph-image"),
    telephone: SITE.phoneE164,
    email: SITE.email,
    priceRange: "KSh",
    currenciesAccepted: SITE.currency,
    paymentAccepted: "M-Pesa, Cash on delivery",
    areaServed: [
      { "@type": "City", name: "Nairobi" },
      { "@type": "Country", name: SITE.country },
    ],
    address: {
      "@type": "PostalAddress",
      addressLocality: SITE.city,
      addressRegion: "Nairobi",
      addressCountry: "KE",
    },
    sameAs: Object.values(SITE.socials).filter(Boolean),
    knowsAbout: [
      "Custom mirrors",
      "Bespoke home décor",
      "Cushion covers",
      "Throw blankets",
      "Rugs and carpets",
    ],
  };
}

/** Site-level entity — enables the sitelinks search box in Google results. */
export function webSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${url}/#website`,
    url,
    name: SITE.name,
    description: SITE.shortDesc,
    inLanguage: "en-KE",
    publisher: { "@id": `${url}/#store` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${url}/shop?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** Breadcrumb trail — renders as the path line under a Google result. */
export function breadcrumbJsonLd(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

/**
 * Product rich-result data.
 *
 * Availability reflects real stock: made-to-order pieces are MadeToOrder rather
 * than pretending to be in stock, and a stocked piece at zero is OutOfStock.
 * aggregateRating is omitted entirely when there are no reviews — Google treats
 * an empty rating as a structured-data error.
 */
export function productJsonLd(product: Product) {
  const availability = product.bespoke
    ? "https://schema.org/MadeToOrder"
    : product.inStock > 0
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock";

  // Prices are quoted as valid to the end of the current year.
  const validUntil = new Date();
  validUntil.setMonth(11, 31);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}/shop/${product.slug}#product`,
    name: product.name,
    description: product.description || product.shortDesc,
    image: product.images.map(absoluteUrl),
    sku: product.slug,
    category: product.category,
    material: product.materials?.join(", ") || undefined,
    color: product.colors?.[0] || undefined,
    brand: { "@type": "Brand", name: SITE.name },
    ...(product.reviews > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.reviews,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: SITE.currency,
      priceValidUntil: validUntil.toISOString().slice(0, 10),
      itemCondition: "https://schema.org/NewCondition",
      availability,
      url: `${url}/shop/${product.slug}`,
      seller: { "@id": `${url}/#store` },
      areaServed: { "@type": "Country", name: SITE.country },
      // Google surfaces delivery terms in the shopping result.
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingDestination: [
          { "@type": "DefinedRegion", addressCountry: "KE", addressRegion: "Nairobi" },
          { "@type": "DefinedRegion", addressCountry: "KE" },
        ],
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 1,
            maxValue: product.bespoke ? 14 : 2,
            unitCode: "DAY",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 1,
            maxValue: 5,
            unitCode: "DAY",
          },
        },
        description: DELIVERY_POLICY.short,
      },
    },
  };
}

/** Category/collection listing — helps Google understand the shop page. */
export function itemListJsonLd(products: Product[], listName: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: listName,
    numberOfItems: products.length,
    itemListElement: products.slice(0, 30).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${url}/shop/${p.slug}`,
      name: p.name,
      image: absoluteUrl(p.images[0] ?? ""),
    })),
  };
}

/** Serialise a JSON-LD block. Kept in one place so escaping is consistent. */
export function jsonLdScript(data: object): string {
  // "<" is escaped so a product name containing markup cannot break out of the
  // surrounding script tag.
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
