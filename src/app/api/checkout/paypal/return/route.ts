import { NextResponse } from "next/server";
import { capturePaypalOrder } from "@/lib/paypal";
import { markOrderPaid } from "@/lib/orders";
import { SITE } from "@/lib/site";

/** PayPal redirects here after approval (?token=<orderId>&ref=<orderRef>). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token"); // PayPal order id
  const ref = url.searchParams.get("ref") ?? "";

  try {
    if (token) {
      await capturePaypalOrder(token);
      if (ref) await markOrderPaid(ref, token).catch(() => null);
    }
    return NextResponse.redirect(
      `${SITE.url}/checkout/success?ref=${ref}&method=paypal`
    );
  } catch {
    return NextResponse.redirect(`${SITE.url}/checkout?error=paypal`);
  }
}
