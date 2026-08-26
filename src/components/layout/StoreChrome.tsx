"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Renders the storefront chrome (header, footer, WhatsApp float, cart) for all
 * public pages, but not for the /admin dashboard, which has its own shell.
 * Server components (Footer) are passed in as slots so they can render on the
 * server while this client component only decides visibility.
 */
export function StoreChrome({
  header,
  footer,
  float,
  drawer,
  children,
}: {
  header: ReactNode;
  footer: ReactNode;
  float: ReactNode;
  drawer: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) return <>{children}</>;

  return (
    <>
      {header}
      <main className="flex-1">{children}</main>
      {footer}
      {float}
      {drawer}
    </>
  );
}
