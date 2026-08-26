import { Hero } from "@/components/home/Hero";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { CategoryShowcase } from "@/components/home/CategoryShowcase";
import { BespokeBand } from "@/components/home/BespokeBand";
import { Testimonials } from "@/components/home/Testimonials";
import { FinalCTA } from "@/components/home/FinalCTA";
import { getFeaturedProducts } from "@/lib/products";
import { itemListJsonLd, jsonLdScript } from "@/lib/seo";
import { SITE } from "@/lib/site";
import type { Metadata } from "next";

// The home page is the main ranking target, so it states its own title and
// description rather than inheriting the layout defaults.
export const metadata: Metadata = {
  // `absolute` bypasses the layout template, which would otherwise append the
  // brand name a second time.
  title: {
    absolute: `${SITE.name} — Custom Mirrors & Bespoke Home Décor in Kenya`,
  },
  description:
    "Handmade custom mirrors, throws, cushions, rugs and bath accents, made to order in Kenya. Delivery in Nairobi with pay on delivery, and countrywide by courier.",
  alternates: { canonical: "/" },
  openGraph: {
    title: `${SITE.name} — Curated Decor, Creations & Accents`,
    description:
      "Custom-crafted mirrors and bespoke home décor, handmade in Kenya. Delivered in Nairobi and countrywide.",
    url: "/",
    type: "website",
  },
};

// Cached HTML for speed/SEO, refreshed hourly — admin saves purge it instantly
// via revalidateStorefront().
export const revalidate = 3600;

export default async function HomePage() {
  const featured = await getFeaturedProducts(8);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(itemListJsonLd(featured, "Featured pieces")),
        }}
      />
      <Hero />
      <FeaturedProducts products={featured} />
      <CategoryShowcase />
      <BespokeBand />
      <Testimonials />
      <FinalCTA />
    </>
  );
}
