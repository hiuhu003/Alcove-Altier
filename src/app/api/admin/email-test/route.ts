import { NextResponse } from "next/server";
import { guardAdminApi } from "@/lib/http";
import { getCurrentUser } from "@/lib/users";
import { emailTransport, sendTestEmail } from "@/lib/email";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** What the dashboard shows about email setup. */
export async function GET() {
  const denied = await guardAdminApi();
  if (denied) return denied;
  return NextResponse.json({ ok: true, transport: emailTransport() });
}

/**
 * Sends a test message to the signed-in admin so email setup can be proved
 * without placing a real order. Rate limited because it sends real mail.
 */
export async function POST(req: Request) {
  const denied = await guardAdminApi();
  if (denied) return denied;

  const limit = rateLimit(`email-test:${clientIp(req)}`, 5, 10 * 60 * 1000);
  if (!limit.ok) return tooManyRequests(limit, "Please wait a few minutes before testing again.");

  const admin = await getCurrentUser();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
  }

  const result = await sendTestEmail(admin.email);
  return NextResponse.json(
    { ok: result.ok, detail: result.detail, to: admin.email, transport: emailTransport() },
    { status: result.ok ? 200 : 400 }
  );
}
