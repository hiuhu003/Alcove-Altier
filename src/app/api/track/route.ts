import { NextResponse } from "next/server";
import { findOrderForGuest } from "@/lib/customer-orders";
import { forbidden, isSameOrigin } from "@/lib/http";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Guest order lookup. Rate limited because reference + email is a guessable
 * pair given enough attempts; 15 tries per 10 minutes is plenty for someone
 * mistyping their own reference and useless for enumeration.
 */
export async function POST(req: Request) {
  if (!(await isSameOrigin())) return forbidden();

  const limit = rateLimit(`track:${clientIp(req)}`, 15, 10 * 60 * 1000);
  if (!limit.ok) {
    return tooManyRequests(limit, "Too many lookups. Please try again in a few minutes.");
  }

  try {
    const { ref, email } = await req.json();
    if (typeof ref !== "string" || typeof email !== "string") {
      return NextResponse.json({ ok: false, error: "Please fill in both fields." }, { status: 400 });
    }

    const order = await findOrderForGuest(ref, email);
    if (!order) {
      // One message for both "no such reference" and "wrong email", so this
      // can't be used to test whether a reference exists.
      return NextResponse.json(
        {
          ok: false,
          error:
            "We couldn't find an order with that reference and email. Check both and try again, or message us on WhatsApp.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, order });
  } catch (err) {
    console.error("[track] lookup failed:", err);
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
