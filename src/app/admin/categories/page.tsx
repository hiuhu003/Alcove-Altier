import { requireAdmin } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { CategoriesManager } from "@/components/admin/CategoriesManager";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  await requireAdmin();
  return (
    <AdminShell active="categories" title="Categories">
      <CategoriesManager />
    </AdminShell>
  );
}
