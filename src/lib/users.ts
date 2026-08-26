import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "./prisma";
import { PublicError } from "./errors";
import { decoyHash, hashPassword, verifyPassword } from "./password";

export { hashPassword, verifyPassword };

/**
 * Customer accounts.
 *
 * Password hashing lives in ./password so command-line scripts can share it.
 *
 * Sessions reuse the same signed-cookie shape as the admin session: the cookie
 * carries `<userId>.<expiry>.<nonce>.<hmac>` and never the password, so a stolen
 * cookie can't be turned back into credentials and every session expires.
 */

export const USER_COOKIE = "aa_user";
export const USER_SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const IS_PROD = process.env.NODE_ENV === "production";

// --- Session cookie ----------------------------------------------------------

function sessionSecret(): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();
  if (secret) return `user:${secret}`;
  return IS_PROD ? null : "user:alcove-dev-session-secret";
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ha = createHmac("sha256", "cmp").update(a).digest();
  const hb = createHmac("sha256", "cmp").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function issueUserToken(userId: string): string | null {
  const secret = sessionSecret();
  if (!secret) return null;
  const expires = Date.now() + USER_SESSION_MAX_AGE * 1000;
  const nonce = randomBytes(9).toString("base64url");
  const payload = `${userId}.${expires}.${nonce}`;
  return `${payload}.${sign(payload, secret)}`;
}

export function readUserToken(token: string | undefined): string | null {
  const secret = sessionSecret();
  if (!secret || !token) return null;
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [userId, expires, nonce, signature] = parts;
  if (!safeEqual(signature, sign(`${userId}.${expires}.${nonce}`, secret))) return null;
  const expiresAt = Number(expires);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return null;
  return userId;
}

// --- Public shape ------------------------------------------------------------

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
};

export function isAdminRole(role: string | undefined | null): boolean {
  return role === "admin";
}

/** The signed-in user for the current request, or null. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const userId = readUserToken(store.get(USER_COOKIE)?.value);
  if (!userId) return null;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, phone: true, role: true },
    });
    return user;
  } catch {
    // Database hiccup shouldn't log everyone out mid-request; treat as guest.
    return null;
  }
}

// --- Registration / sign-in --------------------------------------------------

export const signUpSchema = z.object({
  name: z.string().trim().min(2, "Please tell us your name"),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .max(20)
    .optional()
    .or(z.literal("")),
  password: z
    .string()
    .min(8, "Use at least 8 characters")
    .max(200, "That password is too long"),
});

export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export async function registerUser(input: z.infer<typeof signUpSchema>): Promise<SessionUser> {
  const data = signUpSchema.parse(input);

  const existing = await prisma.user.findUnique({
    where: { email: data.email },
    select: { id: true },
  });
  if (existing) {
    throw new PublicError(
      "An account with that email already exists. Try signing in instead.",
      409
    );
  }

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      passwordHash: await hashPassword(data.password),
      role: "customer",
    },
    select: { id: true, email: true, name: true, phone: true, role: true },
  });

  // Adopt any guest orders already placed with this email, so the account's
  // history is complete the moment it is created.
  await prisma.order
    .updateMany({ where: { email: data.email, userId: null }, data: { userId: user.id } })
    .catch(() => null);

  return user;
}

export async function authenticate(
  input: z.infer<typeof signInSchema>
): Promise<SessionUser | null> {
  const data = signInSchema.parse(input);
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) {
    // Spend roughly the same time as a real verification so the response time
    // doesn't reveal whether the email is registered.
    await verifyPassword(data.password, decoyHash());
    return null;
  }
  const ok = await verifyPassword(data.password, user.passwordHash);
  if (!ok) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
  };
}

/** Where a user lands after signing in. */
export function landingPageFor(user: SessionUser): string {
  return isAdminRole(user.role) ? "/admin" : "/account";
}
