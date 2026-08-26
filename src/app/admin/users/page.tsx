import { requireAdmin } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { UsersManager } from "@/components/admin/UsersManager";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  await requireAdmin("/admin/users");
  return (
    <AdminShell active="users" title="Team & customers">
      <UsersManager />
    </AdminShell>
  );
}
