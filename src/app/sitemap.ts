import type { MetadataRoute } from "next";
import { getAllProducts, getCategories } from "@/lib/products";
import { absoluteUrl } from "@/lib/seo";
import { SITE } from "@/lib/site";

// Regenerated hourly (and on every admin catalogue save) so new pieces are
// discoverable without a redeploy.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE.url;
  const [products, categories] = await Promise.all([
    getAllProducts(),
    getCategories(),
  ]);

  // Newest product edit doubles as the "last changed" signal for the listing
  // pages, so crawlers re-fetch them when the catalogue actually moves.
  const latest = products.reduce<Date>((newest, p) => {
    const d = new Date(p.createdAt);
    return d > newest ? d : newest;
  }, new Date(0));
  const catalogueChanged = latest.getTime() > 0 ? latest : new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: catalogueChanged, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/shop`, lastModified: catalogueChanged, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${base}/shop?category=${c.slug}`,
    lastModified: catalogueChanged,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${base}/shop/${p.slug}`,
    lastModified: new Date(p.createdAt),
    changeFrequency: "weekly",
    priority: 0.8,
    // Image sitemaps help the pieces surface in Google Images, which matters a
    // lot for a visual, photography-led catalogue.
    images: p.images.slice(0, 3).map(absoluteUrl),
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
