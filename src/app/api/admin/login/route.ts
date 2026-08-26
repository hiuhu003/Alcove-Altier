import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  SESSION_MAX_AGE,
  checkPassword,
  isAdminConfigured,
  issueSessionToken,
} from "@/lib/auth";
import { isSameOrigin, forbidden } from "@/lib/http";
import { clientIp, rateLimit, resetRateLimit, tooManyRequests } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// Brute-force ceiling: 8 attempts per IP per 15 minutes.
const LIMIT = 8;
const WINDOW_MS = 15 * 60 * 1000;

export async function POST(req: Request) {
  if (!(await isSameOrigin())) return forbidden();

  const key = `admin-login:${clientIp(req)}`;
  const limit = rateLimit(key, LIMIT, WINDOW_MS);
  if (!limit.ok) {
    return tooManyRequests(limit, "Too many attempts. Please try again later.");
  }

  if (!isAdminConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Admin login is not configured on this deployment." },
      { status: 503 }
    );
  }

  const { password } = await req.json().catch(() => ({ password: "" }));
  if (!checkPassword(password)) {
    // Deliberately vague: don't confirm whether a password exists or its shape.
    return NextResponse.json({ ok: false, error: "Incorrect password" }, { status: 401 });
  }

  const token = issueSessionToken();
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "Admin login is not configured on this deployment." },
      { status: 503 }
    );
  }

  resetRateLimit(key); // a good password clears the attempt counter
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}

export async function DELETE() {
  if (!(await isSameOrigin())) return forbidden();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}
