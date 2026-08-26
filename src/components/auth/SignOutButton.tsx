"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { ButtonSpinner, useFeedback } from "@/components/ui/Feedback";

/** Ends the session and returns to the storefront. */
export function SignOutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const { toast } = useFeedback();
  const [loading, setLoading] = useState(false);

  async function signOut() {
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
      onClick={signOut}
      disabled={loading}
      className={
        compact
          ? "flex items-center gap-2 text-sm text-graphite transition-colors hover:text-coral"
          : "flex h-11 items-center gap-2 rounded-full border border-charcoal/20 px-5 text-sm font-medium transition-colors hover:border-charcoal"
      }
    >
      {loading ? <ButtonSpinner /> : <LogOut className="h-4 w-4" />}
      Sign out
    </button>
  );
}
