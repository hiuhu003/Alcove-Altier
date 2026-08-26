import { NextResponse } from "next/server";
import { z } from "zod";
import { guardAdminApi } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { revalidateStorefront } from "@/lib/revalidate";
import { slugify } from "@/lib/utils";

const patch = z.object({
  name: z.string().min(1).optional(),
  blurb: z.string().optional(),
  image: z.string().optional(),
  order: z.coerce.number().int().optional(),
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
    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(d.name !== undefined && { name: d.name, slug: slugify(d.name) }),
        ...(d.blurb !== undefined && { blurb: d.blurb }),
        ...(d.image !== undefined && { image: d.image }),
        ...(d.order !== undefined && { order: d.order }),
      },
    });
    revalidateStorefront();
    return NextResponse.json({ ok: true, category });
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
  await prisma.category.delete({ where: { id } }).catch(() => null);
  revalidateStorefront();
  return NextResponse.json({ ok: true });
}
