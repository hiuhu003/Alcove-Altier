import type { Metadata } from "next";
import { ShopClient } from "@/components/shop/ShopClient";
import { getAllProducts, getCategories } from "@/lib/products";
import { itemListJsonLd, jsonLdScript, breadcrumbJsonLd } from "@/lib/seo";

/**
 * Category filters are query params (`/shop?category=mirrors`), which Google
 * treats as separate URLs. Each one gets its own title/description so it can
 * rank for that category, and a self-referencing canonical so the variants
 * aren't read as duplicates of each other.
 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}): Promise<Metadata> {
  const { category } = await searchParams;
  const categories = await getCategories();
  const match = category ? categories.find((c) => c.slug === category) : undefined;

  if (!match) {
    return {
      title: "Shop — Custom Mirrors, Throws, Cushions, Rugs & More",
      description:
        "Browse Alcove Atelier's handmade collection. Filter by category, colour, size and price, or search for a specific piece. Delivery in Nairobi and countrywide.",
      alternates: { canonical: "/shop" },
    };
  }

  return {
    title: `${match.name} — Handmade in Kenya`,
    description:
      match.blurb ||
      `Shop Alcove Atelier's ${match.name.toLowerCase()} — handmade to order in Kenya, delivered in Nairobi and countrywide.`,
    alternates: { canonical: `/shop?category=${match.slug}` },
    openGraph: {
      title: `${match.name} · Alcove Atelier`,
      description: match.blurb,
      url: `/shop?category=${match.slug}`,
      images: match.image ? [{ url: match.image, alt: match.name }] : undefined,
    },
  };
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const [products, categories] = await Promise.all([
    getAllProducts(),
    getCategories(),
  ]);

  const match = category ? categories.find((c) => c.slug === category) : undefined;
  const listed = match ? products.filter((p) => p.category === match.slug) : products;

  const crumbs = breadcrumbJsonLd(
    match
      ? [
          { name: "Home", path: "/" },
          { name: "Shop", path: "/shop" },
          { name: match.name, path: `/shop?category=${match.slug}` },
        ]
      : [
          { name: "Home", path: "/" },
          { name: "Shop", path: "/shop" },
        ]
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            itemListJsonLd(listed, match ? match.name : "The Collection")
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(crumbs) }}
      />
      <ShopClient
        products={products}
        categories={categories}
        initialCategory={category}
      />
    </>
  );
}
