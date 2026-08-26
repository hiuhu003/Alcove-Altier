import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { SITE } from "./site";

/**
 * Signed links for review invitations.
 *
 * The "how did we do?" email has to work without a sign-in — people read email
 * on a phone that isn't logged in, and a login wall kills the response rate. So
 * the link carries an HMAC of the order id: only someone who received the email
 * can open the form, and the token can't be guessed or edited to point at
 * someone else's order.
 */

function secret(): string | null {
  const value = process.env.ADMIN_SESSION_SECRET?.trim();
  if (value) return `review:${value}`;
  return process.env.NODE_ENV === "production" ? null : "review:alcove-dev-session-secret";
}

export function signReviewToken(orderId: string): string | null {
  const key = secret();
  if (!key) return null;
  return createHmac("sha256", key).update(orderId).digest("base64url");
}

export function verifyReviewToken(orderId: string, token: string | undefined): boolean {
  const expected = signReviewToken(orderId);
  if (!expected || !token) return false;
  const a = createHmac("sha256", "cmp").update(token).digest();
  const b = createHmac("sha256", "cmp").update(expected).digest();
  return timingSafeEqual(a, b);
}

export function reviewUrlFor(orderId: string): string | null {
  const token = signReviewToken(orderId);
  if (!token) return null;
  return `${SITE.url}/review/${orderId}?t=${token}`;
}
