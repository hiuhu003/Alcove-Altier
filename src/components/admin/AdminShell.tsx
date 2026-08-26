import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ExternalLink,
  Tags,
  BarChart3,
} from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { LogoutButton } from "./LogoutButton";
import { NotificationBell } from "./NotificationBell";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, key: "dashboard" },
  { href: "/admin/products", label: "Products", icon: Package, key: "products" },
  { href: "/admin/categories", label: "Categories", icon: Tags, key: "categories" },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart, key: "orders" },
  { href: "/admin/reports", label: "Reports", icon: BarChart3, key: "reports" },
];

export function AdminShell({
  active,
  title,
  children,
}: {
  active: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="admin-root flex min-h-screen bg-sand text-charcoal">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-charcoal/10 bg-cream p-5 md:flex">
        <Link href="/admin" className="mb-8 flex items-center gap-2 px-2">
          <LogoMark className="h-8" />
          <span className="font-serif text-lg">Atelier</span>
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {nav.map((n) => (
            <Link
              key={n.key}
              href={n.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                active === n.key
                  ? "bg-pink-strong text-white"
                  : "text-graphite hover:bg-charcoal/5"
              }`}
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-1 border-t border-charcoal/10 pt-4">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-graphite hover:bg-charcoal/5"
          >
            <ExternalLink className="h-4 w-4" /> View site
          </Link>
          <LogoutButton />
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-charcoal/10 bg-cream/80 px-6 py-4 backdrop-blur">
          <h1 className="font-serif text-2xl">{title}</h1>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="md:hidden">
              <LogoutButton compact />
            </div>
          </div>
        </header>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
