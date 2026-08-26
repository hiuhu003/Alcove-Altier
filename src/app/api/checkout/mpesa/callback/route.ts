import { NextResponse } from "next/server";
import { timingSafeEqual, createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { notifyOrderPaid } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/**
 * Daraja calls this URL with the STK Push result. We match on CheckoutRequestID
 * (stored as the order's paymentRef when the push was initiated) and mark the
 * order paid when successful.
 *
 * This endpoint can move money-related state, so it is authenticated by the
 * secret token embedded in the callback URL we hand Safaricom
 * (MPESA_CALLBACK_TOKEN). Without a configured token the endpoint refuses to
 * act in production rather than trusting whoever posts to it.
 */
function tokenValid(req: Request): boolean {
  const expected = process.env.MPESA_CALLBACK_TOKEN?.trim();
  if (!expected) {
    // No token configured: only tolerated outside production (local testing).
    return process.env.NODE_ENV !== "production";
  }
  const provided = new URL(req.url).searchParams.get("token") ?? "";
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  // Safaricom retries on non-200, so every response below is 200 with a
  // ResultCode — including the rejection, which simply does nothing.
  if (!tokenValid(req)) {
    console.warn("[mpesa] callback rejected: bad or missing token");
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Ignored" });
  }

  try {
    const body = await req.json();
    const cb = body?.Body?.stkCallback;
    if (!cb) return NextResponse.json({ ResultCode: 0, ResultDesc: "Ignored" });

    const checkoutId: string | undefined = cb.CheckoutRequestID;
    if (checkoutId) {
      if (cb.ResultCode === 0) {
        const meta: { Name: string; Value: string | number }[] =
          cb.CallbackMetadata?.Item ?? [];
        const receipt = meta.find((m) => m.Name === "MpesaReceiptNumber")?.Value;

        // Only flip orders that are still awaiting payment — a replayed
        // callback then changes nothing.
        const order = await prisma.order.findFirst({
          where: { paymentRef: checkoutId, paymentStatus: { not: "paid" } },
          select: { id: true, ref: true, total: true },
        });
        if (order) {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              paymentStatus: "paid",
              status: "confirmed",
              paymentRef: String(receipt ?? checkoutId),
            },
          });
          await notifyOrderPaid({
            ref: order.ref,
            total: order.total,
            paymentRef: String(receipt ?? checkoutId),
          });
        }
      } else {
        await prisma.order.updateMany({
          where: { paymentRef: checkoutId, paymentStatus: { not: "paid" } },
          data: { paymentStatus: "failed" },
        });
      }
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (err) {
    console.error("[mpesa] callback error:", err);
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }
}
