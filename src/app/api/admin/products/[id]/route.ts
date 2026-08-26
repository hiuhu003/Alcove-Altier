import { NextResponse } from "next/server";
import { z } from "zod";
import { guardAdminApi } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { revalidateStorefront } from "@/lib/revalidate";
import { reviewStockFor } from "@/lib/notifications";
import { slugify } from "@/lib/utils";

const patch = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().optional(),
  category: z.string().optional(),
  price: z.coerce.number().int().nonnegative().optional(),
  compareAt: z.coerce.number().int().nonnegative().nullable().optional(),
  shortDesc: z.string().optional(),
  description: z.string().optional(),
  images: z.array(z.string()).optional(),
  colors: z.array(z.string()).optional(),
  sizes: z.array(z.string()).optional(),
  materials: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
  bespoke: z.boolean().optional(),
  inStock: z.coerce.number().int().nonnegative().optional(),
  published: z.boolean().optional(),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await guardAdminApi();
  if (denied) return denied;
  const { id } = await params;
  try {
    const d = patch.parse(await req.json());
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(d.name !== undefined && { name: d.name }),
        ...(d.slug !== undefined && { slug: slugify(d.slug) }),
        ...(d.category !== undefined && { category: d.category }),
        ...(d.price !== undefined && { price: d.price }),
        ...(d.compareAt !== undefined && { compareAt: d.compareAt }),
        ...(d.shortDesc !== undefined && { shortDesc: d.shortDesc }),
        ...(d.description !== undefined && { description: d.description }),
        ...(d.images !== undefined && { images: JSON.stringify(d.images) }),
        ...(d.colors !== undefined && { colors: JSON.stringify(d.colors) }),
        ...(d.sizes !== undefined && { sizes: JSON.stringify(d.sizes) }),
        ...(d.materials !== undefined && { materials: JSON.stringify(d.materials) }),
        ...(d.featured !== undefined && { featured: d.featured }),
        ...(d.bespoke !== undefined && { bespoke: d.bespoke }),
        ...(d.inStock !== undefined && { inStock: d.inStock }),
        ...(d.published !== undefined && { published: d.published }),
      },
    });
    // Restocking (or unpublishing) clears the stock alert straight away.
    if (d.inStock !== undefined || d.bespoke !== undefined || d.published !== undefined) {
      await reviewStockFor(product.id);
    }
    revalidateStorefront(product.slug);
    return NextResponse.json({ ok: true, product });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await guardAdminApi();
  if (denied) return denied;
  const { id } = await params;
  const gone = await prisma.product.delete({ where: { id } }).catch(() => null);
  revalidateStorefront(gone?.slug);
  return NextResponse.json({ ok: true });
}
