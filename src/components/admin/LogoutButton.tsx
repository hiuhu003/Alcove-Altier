"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { ButtonSpinner, useFeedback } from "@/components/ui/Feedback";

/**
 * Signs out of the dashboard and returns to the storefront.
 *
 * Uses the same endpoint as the storefront sign-out, which clears both the
 * customer session and the admin one. Clearing only the admin cookie used to
 * leave the account still signed in, so the header avatar stayed put and it was
 * unclear what had actually happened.
 */
export function LogoutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const { toast } = useFeedback();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      await fetch("/api/auth", { method: "DELETE" });
      toast.success("Signed out", "See you again soon.");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Could not sign out", "Please try again.");
      setLoading(false);
    }
  }

  return (
    <button
      onClick={logout}
      disabled={loading}
      aria-label="Sign out"
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-graphite transition-colors hover:bg-charcoal/5 disabled:opacity-60"
    >
      {loading ? <ButtonSpinner /> : <LogOut className="h-4 w-4" />}
      {compact ? "" : "Sign out"}
    </button>
  );
}
