import "server-only";

/**
 * Safaricom Daraja (M-Pesa) STK Push helper.
 * Requires MPESA_* env vars. Exposes isConfigured() so callers can fall back
 * gracefully when keys aren't set yet.
 */

const ENV = process.env.MPESA_ENV === "production" ? "production" : "sandbox";
const BASE =
  ENV === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

export function isMpesaConfigured(): boolean {
  return Boolean(
    process.env.MPESA_CONSUMER_KEY &&
      process.env.MPESA_CONSUMER_SECRET &&
      process.env.MPESA_SHORTCODE &&
      process.env.MPESA_PASSKEY
  );
}

/** Normalise a Kenyan number to 2547XXXXXXXX / 2541XXXXXXXX. */
export function normalizePhone(input: string): string {
  let p = input.replace(/\D/g, "");
  if (p.startsWith("0")) p = "254" + p.slice(1);
  if (p.startsWith("7") || p.startsWith("1")) p = "254" + p;
  if (p.startsWith("2540")) p = "254" + p.slice(4);
  return p;
}

function timestamp(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    d.getFullYear().toString() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  );
}

async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString("base64");
  const res = await fetch(
    `${BASE}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${auth}` }, cache: "no-store" }
  );
  if (!res.ok) throw new Error("M-Pesa auth failed");
  const data = await res.json();
  return data.access_token as string;
}

/**
 * The URL Daraja posts the payment result to. A secret token is appended so the
 * endpoint can reject anything that isn't the callback we asked for — without
 * it, anyone who guessed a CheckoutRequestID could mark an order paid.
 */
export function callbackUrl(): string {
  const base =
    process.env.MPESA_CALLBACK_URL ||
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/checkout/mpesa/callback`;
  const token = process.env.MPESA_CALLBACK_TOKEN;
  if (!token) return base;
  return `${base}${base.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}`;
}

export async function stkPush(opts: {
  phone: string;
  amount: number;
  accountRef: string;
  description: string;
}) {
  const token = await getAccessToken();
  const shortcode = process.env.MPESA_SHORTCODE!;
  const passkey = process.env.MPESA_PASSKEY!;
  const ts = timestamp(new Date());
  const password = Buffer.from(`${shortcode}${passkey}${ts}`).toString("base64");

  const res = await fetch(`${BASE}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: ts,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.max(1, Math.round(opts.amount)),
      PartyA: normalizePhone(opts.phone),
      PartyB: shortcode,
      PhoneNumber: normalizePhone(opts.phone),
      CallBackURL: callbackUrl(),
      AccountReference: opts.accountRef.slice(0, 12),
      TransactionDesc: opts.description.slice(0, 13),
    }),
  });

  const data = await res.json();
  if (!res.ok || data.errorCode) {
    throw new Error(data.errorMessage || "STK push failed");
  }
  return data as {
    MerchantRequestID: string;
    CheckoutRequestID: string;
    ResponseCode: string;
    CustomerMessage: string;
  };
}
