import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { SITE } from "@/lib/site";
import { isSameOrigin, forbidden } from "@/lib/http";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// Only the order reference is accepted. Line items and prices are read back
// from the database — a client that sent its own prices could otherwise buy a
// KSh 40,000 mirror for KSh 1.
const schema = z.object({ ref: z.string().min(3).max(32) });

export async function POST(req: Request) {
  if (!(await isSameOrigin())) return forbidden();

  const limit = rateLimit(`stripe:${clientIp(req)}`, 10, 10 * 60 * 1000);
  if (!limit.ok) return tooManyRequests(limit, "Please try again shortly.");

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return NextResponse.json({
      ok: false,
      needsConfig: true,
      message:
        "Card payments aren't connected yet. Add your Stripe keys to enable checkout, or pay via M-Pesa / WhatsApp.",
    });
  }

  try {
    const { ref } = schema.parse(await req.json());

    const order = await prisma.order.findUnique({
      where: { ref },
      include: { items: true },
    });
    if (!order || order.paymentStatus === "paid") {
      return NextResponse.json(
        { ok: false, error: "That order can't be paid for." },
        { status: 400 }
      );
    }

    const { default: Stripe } = await import("stripe");
    const stripe = new Stripe(key);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: order.email,
      client_reference_id: order.ref,
      line_items: order.items.map((i) => ({
        quantity: i.qty,
        price_data: {
          currency: "kes",
          unit_amount: Math.round(i.price * 100),
          product_data: { name: i.name },
        },
      })),
      success_url: `${SITE.url}/checkout/success?ref=${order.ref}&method=card`,
      cancel_url: `${SITE.url}/checkout?cancelled=1`,
      metadata: { ref: order.ref },
    });

    return NextResponse.json({ ok: true, url: session.url });
  } catch (err) {
    // Upstream messages can name internal config; keep them in the logs only.
    console.error("[stripe] session create failed:", err);
    return NextResponse.json(
      { ok: false, error: "Card payment could not be started." },
      { status: 502 }
    );
  }
}
