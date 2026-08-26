import "server-only";
import { PRODUCTS, CATEGORIES } from "@/data/catalogue";
import type { Category, Product } from "./types";

/**
 * Product repository. Prefers the database (managed via /admin) and falls back
 * to the bundled seed catalogue so the storefront always renders — even before
 * the DB is migrated/seeded, or if it's temporarily unavailable.
 */

type DbProduct = {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  compareAt: number | null;
  shortDesc: string;
  description: string;
  images: string;
  colors: string;
  sizes: string;
  materials: string | null;
  featured: boolean;
  bespoke: boolean;
  inStock: number;
  rating: number;
  reviews: number;
  createdAt: Date;
};

function parseArr(v: string | null | undefined): string[] {
  if (!v) return [];
  try {
    const parsed = JSON.parse(v);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toProduct(row: DbProduct): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    price: row.price,
    compareAt: row.compareAt ?? undefined,
    shortDesc: row.shortDesc,
    description: row.description,
    images: parseArr(row.images),
    colors: parseArr(row.colors),
    sizes: parseArr(row.sizes),
    materials: parseArr(row.materials),
    featured: row.featured,
    bespoke: row.bespoke,
    inStock: row.inStock,
    rating: row.rating,
    reviews: row.reviews,
    createdAt: row.createdAt.toISOString(),
  };
}

async function fromDb(): Promise<Product[] | null> {
  try {
    const { prisma } = await import("./prisma");
    const rows = (await prisma.product.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
    })) as unknown as DbProduct[];
    if (!rows || rows.length === 0) return null;
    return rows.map(toProduct);
  } catch {
    // DB not ready (not migrated/seeded) — use the seed catalogue.
    return null;
  }
}

export async function getAllProducts(): Promise<Product[]> {
  const db = await fromDb();
  return db ?? PRODUCTS;
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const all = await getAllProducts();
  const featured = all.filter((p) => p.featured);
  return (featured.length ? featured : all).slice(0, limit);
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  const all = await getAllProducts();
  return all.find((p) => p.slug === slug);
}

export async function getRelated(product: Product, limit = 4): Promise<Product[]> {
  const all = await getAllProducts();
  return all
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, limit);
}

type CategoryRow = {
  slug: string;
  name: string;
  blurb: string;
  image: string;
  order: number;
};

/** Categories from the DB (managed via /admin), falling back to the seed set. */
export async function getCategories(): Promise<Category[]> {
  try {
    const { prisma } = await import("./prisma");
    const rows = (await prisma.category.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
    })) as unknown as CategoryRow[];
    if (rows && rows.length > 0) {
      return rows.map((r) => ({
        slug: r.slug,
        name: r.name,
        blurb: r.blurb,
        image: r.image || `https://picsum.photos/seed/cat-${r.slug}/1200/900`,
      }));
    }
  } catch {
    /* DB not ready — use seed categories */
  }
  return CATEGORIES;
}
