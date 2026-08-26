import { NextResponse } from "next/server";
import { z } from "zod";
import {
  USER_COOKIE,
  USER_SESSION_MAX_AGE,
  authenticate,
  issueUserToken,
  isAdminRole,
  landingPageFor,
  registerUser,
} from "@/lib/users";
import { ADMIN_COOKIE, SESSION_MAX_AGE, issueSessionToken } from "@/lib/auth";
import { isPublicError } from "@/lib/errors";
import { forbidden, isSameOrigin } from "@/lib/http";
import { clientIp, rateLimit, resetRateLimit, tooManyRequests } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * One door for both sign-up and sign-in. Admins use the same form as customers
 * — their role is what decides where they land, not a separate secret URL.
 */

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export async function POST(req: Request) {
  if (!(await isSameOrigin())) return forbidden();

  const body = await req.json().catch(() => null);
  const action = body?.action;
  const ip = clientIp(req);

  // Sign-in is the brute-forceable one, so it gets the tighter budget.
  const key = action === "signup" ? `signup:${ip}` : `signin:${ip}`;
  const limit =
    action === "signup"
      ? rateLimit(key, 5, 60 * 60 * 1000)
      : rateLimit(key, 10, 15 * 60 * 1000);
  if (!limit.ok) {
    return tooManyRequests(
      limit,
      action === "signup"
        ? "Too many sign-up attempts. Please try again later."
        : "Too many sign-in attempts. Please try again in a few minutes."
    );
  }

  try {
    const user =
      action === "signup"
        ? await registerUser(body)
        : await authenticate(body);

    if (!user) {
      // Deliberately identical for "no such account" and "wrong password".
      return NextResponse.json(
        { ok: false, error: "That email or password isn't right." },
        { status: 401 }
      );
    }

    const token = issueUserToken(user.id);
    if (!token) {
      return NextResponse.json(
        { ok: false, error: "Accounts aren't configured on this deployment." },
        { status: 503 }
      );
    }

    resetRateLimit(key);
    const res = NextResponse.json({
      ok: true,
      user: { name: user.name, email: user.email, role: user.role },
      redirect: landingPageFor(user),
    });
    res.cookies.set(USER_COOKIE, token, { ...cookieOptions, maxAge: USER_SESSION_MAX_AGE });

    // An admin signing in here also gets the admin session, so the CMS opens
    // without a second login.
    if (isAdminRole(user.role)) {
      const adminToken = issueSessionToken();
      if (adminToken) {
        res.cookies.set(ADMIN_COOKIE, adminToken, {
          ...cookieOptions,
          maxAge: SESSION_MAX_AGE,
        });
      }
    }
    return res;
  } catch (err) {
    if (isPublicError(err)) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: err.issues[0]?.message ?? "Please check your details." },
        { status: 400 }
      );
    }
    console.error("[auth] failed:", err);
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

/** Sign out — clears both the customer and (if present) admin sessions. */
export async function DELETE() {
  if (!(await isSameOrigin())) return forbidden();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(USER_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  res.cookies.set(ADMIN_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  return res;
}
