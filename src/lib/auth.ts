import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

/**
 * Admin sessions.
 *
 * Admin rights come from an account whose role is "admin" - there is no
 * separate admin password or login page. Signing in at /signin issues this
 * cookie alongside the customer session when the account qualifies.
 *
 * The cookie holds `<expiry>.<nonce>.<hmac>`, never a credential, so a leaked
 * cookie cannot be turned back into a password and every session expires on its
 * own. ADMIN_SESSION_SECRET signs it and is required in production.
 */

const COOKIE = "aa_admin";
const SESSION_DAYS = 7;
const IS_PROD = process.env.NODE_ENV === "production";

// Dev-only fallback so `npm run dev` works with no .env at all.
const DEV_SECRET = "alcove-dev-session-secret";

export const ADMIN_COOKIE = COOKIE;
export const SESSION_MAX_AGE = 60 * 60 * 24 * SESSION_DAYS;

function sessionSecret(): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();
  if (secret) return secret;
  // Kept as a fallback so an older deployment that only set ADMIN_PASSWORD
  // doesn't have every admin session invalidated on deploy.
  const legacy = process.env.ADMIN_PASSWORD?.trim();
  if (legacy) return `derived:${legacy}`;
  return IS_PROD ? null : DEV_SECRET;
}

/** Compare two secrets without leaking their length or contents via timing. */
function safeEqual(a: string, b: string): boolean {
  const hashA = createHmac("sha256", "cmp").update(Buffer.from(a, "utf8")).digest();
  const hashB = createHmac("sha256", "cmp").update(Buffer.from(b, "utf8")).digest();
  return timingSafeEqual(hashA, hashB);
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

/** Mint a fresh signed session token: `<expiresAtMs>.<nonce>.<hmac>`. */
export function issueSessionToken(): string | null {
  const secret = sessionSecret();
  if (!secret) return null;
  const expires = Date.now() + SESSION_MAX_AGE * 1000;
  const nonce = randomBytes(9).toString("base64url");
  const payload = `${expires}.${nonce}`;
  return `${payload}.${sign(payload, secret)}`;
}

/** Verify a session token's signature and expiry. */
export function verifySessionToken(token: string | undefined): boolean {
  const secret = sessionSecret();
  if (!secret || !token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [expires, nonce, signature] = parts;
  if (!safeEqual(signature, sign(`${expires}.${nonce}`, secret))) return false;
  const expiresAt = Number(expires);
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

/**
 * True if the current request carries admin rights.
 *
 * Either the admin cookie, issued at sign-in, or a signed-in account whose role
 * is admin. Checking the role too means promoting someone takes effect on their
 * next request rather than only after they sign in again.
 */
export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  if (verifySessionToken(store.get(COOKIE)?.value)) return true;

  const { getCurrentUser, isAdminRole } = await import("./users");
  const user = await getCurrentUser();
  return isAdminRole(user?.role);
}

/**
 * Gate for admin pages.
 *
 * Nobody signed in -> send them to sign in, remembering where they were headed.
 *
 * Signed in but not an admin -> 404, not "forbidden". A 403 confirms the page
 * exists, which tells a curious customer exactly what to go looking for; a 404
 * says nothing at all.
 */
export async function requireAdmin(nextPath = "/admin"): Promise<void> {
  if (await isAdmin()) return;

  const { getCurrentUser } = await import("./users");
  const user = await getCurrentUser();
  if (user) notFound();

  redirect(`/signin?next=${encodeURIComponent(nextPath)}`);
}

/** For API routes: returns true if authorised. */
export async function isAdminApi(): Promise<boolean> {
  return isAdmin();
}
