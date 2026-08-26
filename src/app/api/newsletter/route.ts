import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isSameOrigin, forbidden } from "@/lib/http";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const schema = z.object({ email: z.string().email().max(254) });

export async function POST(req: Request) {
  if (!(await isSameOrigin())) return forbidden();

  const limit = rateLimit(`newsletter:${clientIp(req)}`, 5, 10 * 60 * 1000);
  if (!limit.ok) return tooManyRequests(limit, "Please try again shortly.");

  try {
    const { email } = schema.parse(await req.json());
    await prisma.subscriber.upsert({
      where: { email: email.toLowerCase() },
      update: {},
      create: { email: email.toLowerCase() },
    });
    return NextResponse.json({ ok: true });
  } catch {
    // Never hard-fail the newsletter box.
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
