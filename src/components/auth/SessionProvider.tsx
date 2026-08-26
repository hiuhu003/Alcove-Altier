"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export type SessionUser = {
  name: string;
  email: string;
  phone: string | null;
  role: string;
} | null;

type SessionValue = {
  user: SessionUser;
  /** True until the first check completes — so the UI doesn't flash "signed out". */
  loading: boolean;
  refresh: () => Promise<void>;
};

const SessionContext = createContext<SessionValue>({
  user: null,
  loading: true,
  refresh: async () => {},
});

export function useSession(): SessionValue {
  return useContext(SessionContext);
}

/**
 * Fetches the session once and shares it with everything that needs it — the
 * header, the cart owner, checkout.
 *
 * Client-side on purpose: reading cookies during the server render would opt
 * every storefront page out of static rendering and give up ISR. Doing it in
 * one place means one request instead of one per component.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await res.json();
      setUser(data.user ?? null);
    } catch {
      // Offline or blocked — treat as signed out rather than breaking the page.
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-check on navigation so signing in or out updates the UI immediately.
  useEffect(() => {
    void refresh();
  }, [pathname, refresh]);

  return (
    <SessionContext.Provider value={{ user, loading, refresh }}>
      {children}
    </SessionContext.Provider>
  );
}
