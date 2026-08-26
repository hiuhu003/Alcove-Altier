import { NextResponse } from "next/server";
import { z } from "zod";
import { guardAdminApi } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { revalidateStorefront } from "@/lib/revalidate";
import { slugify } from "@/lib/utils";

const productInput = z.object({
  name: z.string().min(2),
  slug: z.string().optional(),
  category: z.string().min(1),
  price: z.coerce.number().int().nonnegative(),
  compareAt: z.coerce.number().int().nonnegative().optional().nullable(),
  shortDesc: z.string().default(""),
  description: z.string().default(""),
  images: z.array(z.string()).default([]),
  colors: z.array(z.string()).default([]),
  sizes: z.array(z.string()).default([]),
  materials: z.array(z.string()).optional().default([]),
  featured: z.boolean().default(false),
  bespoke: z.boolean().default(false),
  inStock: z.coerce.number().int().nonnegative().default(0),
  published: z.boolean().default(true),
});

export async function GET() {
  const denied = await guardAdminApi();
  if (denied) return denied;
  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ products });
}

export async function POST(req: Request) {
  const denied = await guardAdminApi();
  if (denied) return denied;
  try {
    const data = productInput.parse(await req.json());
    const slug = slugify(data.slug || data.name);
    const product = await prisma.product.create({
      data: {
        slug,
        name: data.name,
        category: data.category,
        price: data.price,
        compareAt: data.compareAt ?? null,
        shortDesc: data.shortDesc,
        description: data.description,
        images: JSON.stringify(data.images),
        colors: JSON.stringify(data.colors),
        sizes: JSON.stringify(data.sizes),
        materials: JSON.stringify(data.materials ?? []),
        featured: data.featured,
        bespoke: data.bespoke,
        inStock: data.inStock,
        published: data.published,
      },
    });
    revalidateStorefront(product.slug);
    return NextResponse.json({ ok: true, product });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid product";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
