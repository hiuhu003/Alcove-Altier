import { NextResponse } from "next/server";
import { z } from "zod";
import { createPaypalOrder, isPaypalConfigured } from "@/lib/paypal";
import { prisma } from "@/lib/prisma";
import { SITE } from "@/lib/site";
import { isSameOrigin, forbidden } from "@/lib/http";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// Reference only — the amount comes from the stored order, never the client.
const schema = z.object({ ref: z.string().min(3).max(32) });

export async function POST(req: Request) {
  if (!(await isSameOrigin())) return forbidden();

  const limit = rateLimit(`paypal:${clientIp(req)}`, 10, 10 * 60 * 1000);
  if (!limit.ok) return tooManyRequests(limit, "Please try again shortly.");

  if (!isPaypalConfigured()) {
    return NextResponse.json({
      ok: false,
      needsConfig: true,
      message:
        "PayPal isn't connected yet. Add your PayPal credentials to enable it, or pay via M-Pesa / WhatsApp.",
    });
  }

  try {
    const { ref } = schema.parse(await req.json());

    const order = await prisma.order.findUnique({
      where: { ref },
      select: { ref: true, total: true, deliveryFee: true, paymentStatus: true },
    });
    if (!order || order.paymentStatus === "paid") {
      return NextResponse.json(
        { ok: false, error: "That order can't be paid for." },
        { status: 400 }
      );
    }

    const { approveUrl } = await createPaypalOrder({
      ref: order.ref,
      amount: order.total + (order.deliveryFee ?? 0),
      returnUrl: `${SITE.url}/api/checkout/paypal/return?ref=${order.ref}`,
      cancelUrl: `${SITE.url}/checkout?cancelled=1`,
    });
    return NextResponse.json({ ok: true, url: approveUrl });
  } catch (err) {
    console.error("[paypal] order create failed:", err);
    return NextResponse.json(
      { ok: false, error: "PayPal payment could not be started." },
      { status: 502 }
    );
  }
}
