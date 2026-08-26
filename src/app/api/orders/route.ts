import { NextResponse } from "next/server";
import { z } from "zod";
import { createOrder } from "@/lib/orders";
import { isPublicError } from "@/lib/errors";
import { getCurrentUser } from "@/lib/users";
import { isSameOrigin, forbidden } from "@/lib/http";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// A real shopper places one order at a time; this stops scripted order spam
// from filling the client's dashboard and inbox.
const LIMIT = 10;
const WINDOW_MS = 10 * 60 * 1000;

export async function POST(req: Request) {
  if (!(await isSameOrigin())) return forbidden();

  const limit = rateLimit(`orders:${clientIp(req)}`, LIMIT, WINDOW_MS);
  if (!limit.ok) {
    return tooManyRequests(limit, "Too many orders from this device. Please try again shortly.");
  }

  try {
    const body = await req.json();
    // The account comes from the session cookie, never from the request body -
    // a client must not be able to file an order under someone else's account.
    const user = await getCurrentUser();
    const order = await createOrder(body, user?.id);
    return NextResponse.json({ ok: true, ref: order.ref, id: order.id });
  } catch (err) {
    // A rule the customer can act on (wrong delivery zone, etc.) is surfaced
    // verbatim; faults stay generic so internals never reach the browser.
    if (isPublicError(err)) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    if (err instanceof z.ZodError) {
      const message = err.issues[0]?.message ?? "Please check your details.";
      return NextResponse.json({ ok: false, error: message }, { status: 400 });
    }
    console.error("[orders] create failed:", err);
    return NextResponse.json(
      { ok: false, error: "We couldn't place that order. Please try again or message us on WhatsApp." },
      { status: 500 }
    );
  }
}
