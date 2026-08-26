import { NextResponse } from "next/server";
import { z } from "zod";
import { guardAdminApi } from "@/lib/http";
import { dismiss, listNotifications, markRead, syncStockAlerts } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/** GET — the admin's alert list (and unread count). Polled by the bell. */
export async function GET(req: Request) {
  const denied = await guardAdminApi();
  if (denied) return denied;
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 30, 100);

  // Keep stock alerts in step with the catalogue (idempotent, cheap).
  if (searchParams.get("sync") !== "0") await syncStockAlerts();

  const data = await listNotifications(limit);
  return NextResponse.json({ ok: true, ...data });
}

const action = z.object({
  action: z.enum(["read", "read-all", "dismiss", "dismiss-all"]),
  ids: z.array(z.string()).optional(),
});

/** POST — mark alerts read or dismiss them. */
export async function POST(req: Request) {
  const denied = await guardAdminApi();
  if (denied) return denied;
  try {
    const body = action.parse(await req.json());
    if (body.action === "read") await markRead(body.ids);
    if (body.action === "read-all") await markRead();
    if (body.action === "dismiss") await dismiss(body.ids);
    if (body.action === "dismiss-all") await dismiss();
    const data = await listNotifications();
    return NextResponse.json({ ok: true, ...data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
