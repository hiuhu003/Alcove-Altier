import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyReviewToken } from "@/lib/review-invite";
import { refreshProductRating } from "@/lib/reviews";
import { forbidden, isSameOrigin } from "@/lib/http";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const schema = z.object({
  orderId: z.string().min(1),
  token: z.string().min(1),
  productId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  body: z.string().max(1000).optional().default(""),
});

/**
 * Accept a review from an invitation link.
 *
 * Authorisation is the signed token plus the product actually being in that
 * order — so a review can only be left for something the reviewer bought, and
 * only once per order (the unique index does the enforcing).
 */
export async function POST(req: Request) {
  if (!(await isSameOrigin())) return forbidden();

  const limit = rateLimit(`reviews:${clientIp(req)}`, 20, 60 * 60 * 1000);
  if (!limit.ok) return tooManyRequests(limit, "Too many reviews. Please try again later.");

  try {
    const data = schema.parse(await req.json());

    if (!verifyReviewToken(data.orderId, data.token)) {
      return NextResponse.json(
        { ok: false, error: "That review link isn't valid any more." },
        { status: 403 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      select: {
        id: true,
        customerName: true,
        userId: true,
        items: { select: { productId: true } },
      },
    });
    if (!order) {
      return NextResponse.json({ ok: false, error: "Order not found." }, { status: 404 });
    }
    if (!order.items.some((i) => i.productId === data.productId)) {
      return NextResponse.json(
        { ok: false, error: "That piece wasn't part of this order." },
        { status: 400 }
      );
    }

    // Re-opening the link and rating again updates the review rather than
    // failing on the unique index.
    await prisma.review.upsert({
      where: { orderId_productId: { orderId: order.id, productId: data.productId } },
      update: { rating: data.rating, body: data.body },
      create: {
        orderId: order.id,
        productId: data.productId,
        userId: order.userId,
        authorName: order.customerName.split(" ")[0] || "Customer",
        rating: data.rating,
        body: data.body,
      },
    });

    await refreshProductRating(data.productId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: err.issues[0]?.message ?? "Please check your review." },
        { status: 400 }
      );
    }
    console.error("[reviews] submit failed:", err);
    return NextResponse.json(
      { ok: false, error: "We couldn't save that review. Please try again." },
      { status: 500 }
    );
  }
}
