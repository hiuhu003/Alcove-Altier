import { requireAdmin } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { ReportsClient } from "@/components/admin/ReportsClient";
import { buildSalesReport } from "@/lib/reports";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  await requireAdmin();
  // Monthly × 12 is the default view; the client can switch to weekly/yearly.
  const report = await buildSalesReport("monthly", 12);

  return (
    <AdminShell active="reports" title="Sales reports">
      <ReportsClient initial={report} />
    </AdminShell>
  );
}
