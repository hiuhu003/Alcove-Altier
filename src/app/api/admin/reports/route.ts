import { NextResponse } from "next/server";
import { guardAdminApi } from "@/lib/http";
import { buildSalesReport, type Period } from "@/lib/reports";

export const dynamic = "force-dynamic";

function parsePeriod(value: string | null): Period {
  return value === "weekly" || value === "monthly" || value === "yearly" ? value : "monthly";
}

/** GET /api/admin/reports?period=monthly&count=12 — sales report as JSON. */
export async function GET(req: Request) {
  const denied = await guardAdminApi();
  if (denied) return denied;
  const { searchParams } = new URL(req.url);
  const period = parsePeriod(searchParams.get("period"));
  const count = Number(searchParams.get("count")) || undefined;

  try {
    const report = await buildSalesReport(period, count);
    return NextResponse.json({ ok: true, report });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not build report";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
