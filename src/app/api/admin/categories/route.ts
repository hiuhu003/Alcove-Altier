import { NextResponse } from "next/server";
import { z } from "zod";
import { guardAdminApi } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { revalidateStorefront } from "@/lib/revalidate";
import { slugify } from "@/lib/utils";

const input = z.object({
  name: z.string().min(1),
  blurb: z.string().optional().default(""),
  image: z.string().optional().default(""),
});

export async function GET() {
  const denied = await guardAdminApi();
  if (denied) return denied;
  const categories = await prisma.category.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });
  return NextResponse.json({ categories });
}

export async function POST(req: Request) {
  const denied = await guardAdminApi();
  if (denied) return denied;
  try {
    const data = input.parse(await req.json());
    const slug = slugify(data.name);
    if (!slug) throw new Error("Invalid category name");

    const count = await prisma.category.count();
    // Idempotent: reuse an existing category with the same slug, else create.
    const category = await prisma.category.upsert({
      where: { slug },
      update: {
        name: data.name,
        ...(data.blurb ? { blurb: data.blurb } : {}),
        ...(data.image ? { image: data.image } : {}),
      },
      create: {
        slug,
        name: data.name,
        blurb: data.blurb,
        image: data.image,
        order: count,
      },
    });
    revalidateStorefront();
    return NextResponse.json({ ok: true, category });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid category";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
