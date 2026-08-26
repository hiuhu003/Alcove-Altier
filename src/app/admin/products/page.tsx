import { requireAdmin } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { ProductsManager } from "@/components/admin/ProductsManager";
import { parseStockFilter } from "@/lib/stock";

export const dynamic = "force-dynamic";

/**
 * `?q=` and `?stock=low|out` let the dashboard and the alert bell link straight
 * to the products they're complaining about.
 */
export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; stock?: string }>;
}) {
  await requireAdmin();
  const { q, stock } = await searchParams;

  return (
    <AdminShell active="products" title="Products">
      <ProductsManager initialQuery={q ?? ""} initialStock={parseStockFilter(stock)} />
    </AdminShell>
  );
}
