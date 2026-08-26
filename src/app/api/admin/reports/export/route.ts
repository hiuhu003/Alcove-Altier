import { NextResponse } from "next/server";
import { guardAdminApi } from "@/lib/http";
import { buildSalesReport, reportFilename, reportToCsv, type Period } from "@/lib/reports";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

function parsePeriod(value: string | null): Period {
  return value === "weekly" || value === "monthly" || value === "yearly" ? value : "monthly";
}

/**
 * GET /api/admin/reports/export?period=monthly&count=12
 * Downloads the sales report as a spreadsheet-ready CSV.
 */
export async function GET(req: Request) {
  const denied = await guardAdminApi();
  if (denied) return denied;
  const { searchParams } = new URL(req.url);
  const period = parsePeriod(searchParams.get("period"));
  const count = Number(searchParams.get("count")) || undefined;

  const report = await buildSalesReport(period, count);
  const csv = reportToCsv(report, SITE.name);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${reportFilename(report)}"`,
      "Cache-Control": "no-store",
    },
  });
}
