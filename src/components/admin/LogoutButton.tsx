"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  async function logout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  }
  return (
    <button
      onClick={logout}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-graphite hover:bg-charcoal/5"
    >
      <LogOut className="h-4 w-4" /> {compact ? "" : "Sign out"}
    </button>
  );
}
