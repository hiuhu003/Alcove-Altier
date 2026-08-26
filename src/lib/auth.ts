import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

/**
 * Admin authentication.
 *
 * A single shared password (the client is the only admin) is exchanged for a
 * signed, expiring session cookie. The cookie holds `<expiry>.<hmac>` — never
 * the password or the secret itself — so a leaked cookie cannot be turned back
 * into the credentials, and every session dies on its own.
 *
 * In production both ADMIN_PASSWORD and ADMIN_SESSION_SECRET are required: with
 * either missing, login is refused rather than falling back to a known default.
 */

const COOKIE = "aa_admin";
const SESSION_DAYS = 7;
const IS_PROD = process.env.NODE_ENV === "production";

// Dev-only fallbacks so `npm run dev` works with no .env at all.
const DEV_PASSWORD = "alcove-admin";
const DEV_SECRET = "alcove-dev-session-secret";

export const ADMIN_COOKIE = COOKIE;
export const SESSION_MAX_AGE = 60 * 60 * 24 * SESSION_DAYS;

function adminPassword(): string | null {
  const pw = process.env.ADMIN_PASSWORD?.trim();
  if (pw) return pw;
  return IS_PROD ? null : DEV_PASSWORD;
}

function sessionSecret(): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();
  if (secret) return secret;
  // Falling back to the password still gives a per-deployment secret; only in
  // dev do we accept a hard-coded one.
  const pw = process.env.ADMIN_PASSWORD?.trim();
  if (pw) return `derived:${pw}`;
  return IS_PROD ? null : DEV_SECRET;
}

/**
 * True when the admin area is usable. False in production until the client sets
 * ADMIN_PASSWORD — the login page shows a setup notice instead of a form.
 */
export function isAdminConfigured(): boolean {
  return adminPassword() !== null && sessionSecret() !== null;
}

/** Compare two secrets without leaking their length or contents via timing. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  // timingSafeEqual throws on length mismatch, so hash to a fixed width first.
  const hashA = createHmac("sha256", "cmp").update(bufA).digest();
  const hashB = createHmac("sha256", "cmp").update(bufB).digest();
  return timingSafeEqual(hashA, hashB);
}

/** Password check. Always false in production when ADMIN_PASSWORD is unset. */
export function checkPassword(pw: unknown): boolean {
  const expected = adminPassword();
  if (!expected || typeof pw !== "string" || pw.length === 0) return false;
  return safeEqual(pw, expected);
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
 * Either the admin cookie (set when an admin signs in, and by the
 * shared-password fallback at /admin/login) or a signed-in account whose role
 * is admin. Checking both means promoting someone takes effect on their next
 * request rather than only after they sign in again.
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
 * says nothing at all. It is also less confusing than bouncing an already
 * signed-in person back to a sign-in form they have already used.
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
