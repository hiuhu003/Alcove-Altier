import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ProductDetail } from "@/components/shop/ProductDetail";
import { ProductCard } from "@/components/shop/ProductCard";
import { getProduct, getRelated } from "@/lib/products";
import { SITE } from "@/lib/site";
import {
  absoluteUrl,
  breadcrumbJsonLd,
  jsonLdScript,
  productJsonLd,
} from "@/lib/seo";

// Products are managed from the admin/DB. Pages are rendered on first request
// and then cached (ISR) so crawlers get fast static HTML; admin saves purge the
// cache immediately via revalidateStorefront().
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Product not found" };

  const canonical = `/shop/${product.slug}`;
  const images = product.images.slice(0, 2).map(absoluteUrl);
  const priceLine = `${product.name} · KSh ${product.price.toLocaleString("en-KE")}`;

  return {
    title: product.name,
    description: product.shortDesc || product.description.slice(0, 155),
    alternates: { canonical },
    openGraph: {
      title: priceLine,
      description: product.shortDesc,
      url: canonical,
      siteName: SITE.name,
      images: images.map((url) => ({ url, alt: product.name })),
      type: "website",
      locale: SITE.locale,
    },
    twitter: {
      card: "summary_large_image",
      title: priceLine,
      description: product.shortDesc,
      images,
    },
    // Out-of-stock pieces stay indexed on purpose: the JSON-LD reports
    // OutOfStock, and the page keeps its ranking for when it is restocked.
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const related = await getRelated(product);

  const crumbs = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Shop", path: "/shop" },
    { name: product.name, path: `/shop/${product.slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(productJsonLd(product)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(crumbs) }}
      />
      <ProductDetail product={product} />

      {related.length > 0 && (
        <section className="container-x pb-24">
          <div className="mb-10 flex items-end justify-between">
            <h2 className="font-serif text-3xl sm:text-4xl">You may also like</h2>
            <Link href="/shop" className="nav-link text-sm font-medium">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
