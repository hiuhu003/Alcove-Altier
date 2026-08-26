import "server-only";
import { headers } from "next/headers";

/**
 * Cross-site request forgery defence for cookie-authenticated endpoints.
 *
 * The session cookie is SameSite=Lax, so a cross-site POST/PATCH/DELETE never
 * carries it — this is belt-and-braces on top of that, and it also covers
 * same-site-but-untrusted origins. Requests from a browser must present an
 * Origin (or Referer) matching the host they claim to be talking to.
 */
export async function isSameOrigin(): Promise<boolean> {
  const h = await headers();
  const host = h.get("host");
  if (!host) return false;

  const source = h.get("origin") ?? h.get("referer");
  // Non-browser callers (curl, the client's own scripts) send neither. They also
  // carry no ambient cookie, so there is nothing to forge — allow them through.
  if (!source) return true;

  try {
    return new URL(source).host === host;
  } catch {
    return false;
  }
}

/** 403 for a request that failed the same-origin check. */
export function forbidden(message = "Forbidden"): Response {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status: 403,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

/**
 * The single gate for every /api/admin route: valid session + same origin.
 *
 * Returns a Response to send back when the request must be refused, or null
 * when it may proceed. Kept in one place so a new admin route can't
 * accidentally ship without one of the two checks.
 */
export async function guardAdminApi(): Promise<Response | null> {
  const { isAdminApi } = await import("./auth");
  if (!(await isAdminApi())) {
    const { getCurrentUser } = await import("./users");
    const user = await getCurrentUser();

    // Signed in but not an admin: 404, matching the pages. A 403 would confirm
    // the endpoint exists; a 401 would invite them to sign in again, which
    // they have already done.
    if (user) {
      return new Response(JSON.stringify({ ok: false, error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      });
    }

    return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }
  if (!(await isSameOrigin())) return forbidden();
  return null;
}
