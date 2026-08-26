import "server-only";

/**
 * Minimal PayPal REST helper (Orders v2). PayPal does not settle in KES, so
 * international card/PayPal payments are charged in PAYPAL_CURRENCY (default
 * USD). Set a real FX conversion before go-live if you price in KES.
 */

const ENV = process.env.PAYPAL_ENV === "live" ? "live" : "sandbox";
const BASE =
  ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

export const PAYPAL_CURRENCY = process.env.PAYPAL_CURRENCY || "USD";

export function isPaypalConfigured(): boolean {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

async function token(): Promise<string> {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString("base64");
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) throw new Error("PayPal auth failed");
  return (await res.json()).access_token as string;
}

export async function createPaypalOrder(opts: {
  ref: string;
  amount: number; // major units in PAYPAL_CURRENCY
  returnUrl: string;
  cancelUrl: string;
}) {
  const t = await token();
  const res = await fetch(`${BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: opts.ref,
          amount: {
            currency_code: PAYPAL_CURRENCY,
            value: opts.amount.toFixed(2),
          },
        },
      ],
      application_context: {
        brand_name: "Alcove Atelier",
        user_action: "PAY_NOW",
        return_url: opts.returnUrl,
        cancel_url: opts.cancelUrl,
      },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "PayPal order failed");
  const approve = (data.links as { rel: string; href: string }[]).find(
    (l) => l.rel === "approve"
  )?.href;
  return { id: data.id as string, approveUrl: approve };
}

export async function capturePaypalOrder(orderId: string) {
  const t = await token();
  const res = await fetch(`${BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "PayPal capture failed");
  return data;
}
