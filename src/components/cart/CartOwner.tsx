"use client";

import { useEffect } from "react";
import { useSession } from "@/components/auth/SessionProvider";
import { useCart } from "@/store/cart";

/**
 * Keeps the basket tied to whoever is signed in.
 *
 * Without this, one shared localStorage key means the next person to use the
 * browser inherits the previous customer's cart. Anything added before signing
 * in is merged into the account's cart rather than dropped.
 */
export function CartOwner() {
  const { user, loading } = useSession();
  const switchOwner = useCart((s) => s.switchOwner);

  useEffect(() => {
    if (loading) return;
    switchOwner(user ? user.email : null);
  }, [user, loading, switchOwner]);

  return null;
}
