import Link from "next/link";
import {
  Package,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  ArrowRight,
  MessageSquare,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/AdminShell";
import { LOW_STOCK_THRESHOLD } from "@/lib/stock";
import { getZone } from "@/lib/delivery";
import { channelLabel, formatKES } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  await requireAdmin();

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [orderCount, newOrders, productCount, paidAgg, monthAgg, lowStock, recent, messages] =
    await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: "new" } }),
      prisma.product.count(),
      prisma.order.aggregate({
        _sum: { total: true, deliveryFee: true },
        where: { paymentStatus: "paid" },
      }),
      prisma.order.aggregate({
        _sum: { total: true },
        _count: true,
        where: { createdAt: { gte: monthStart }, status: { not: "cancelled" } },
      }),
      prisma.product.findMany({
        where: { bespoke: false, inStock: { lte: LOW_STOCK_THRESHOLD } },
        orderBy: { inStock: "asc" },
        select: { id: true, name: true, inStock: true, slug: true },
        take: 6,
      }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { items: true },
      }),
      prisma.contactMessage.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, name: true, email: true, message: true, createdAt: true },
      }),
    ]);

  const revenue = (paidAgg._sum.total ?? 0) + (paidAgg._sum.deliveryFee ?? 0);
  const outOfStock = lowStock.filter((p) => p.inStock <= 0).length;

  const stats = [
    {
      label: "Total orders",
      value: orderCount,
      icon: ShoppingCart,
      sub: `${newOrders} new`,
      href: "/admin/orders",
    },
    { label: "Revenue (paid)", value: formatKES(revenue), icon: TrendingUp, sub: "confirmed payments" },
    {
      label: "This month",
      value: formatKES(monthAgg._sum.total ?? 0),
      icon: BarChart3,
      sub: `${monthAgg._count} orders`,
      href: "/admin/reports",
    },
    {
      label: "Stock alerts",
      value: lowStock.length,
      icon: AlertTriangle,
      sub: outOfStock > 0 ? `${outOfStock} out of stock` : "running low",
      href: "/admin/products?stock=low",
    },
    { label: "Products", value: productCount, icon: Package, sub: "in catalogue", href: "/admin/products" },
  ];

  return (
    <AdminShell active="dashboard" title="Dashboard">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map((s) => {
          const card = (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-graphite">{s.label}</span>
                <s.icon className="h-5 w-5 text-pink-strong" />
              </div>
              <p className="mt-3 font-serif text-3xl">{s.value}</p>
              <p className="mt-1 text-xs text-graphite">{s.sub}</p>
            </>
          );
          const cls = "rounded-2xl border border-charcoal/10 bg-cream p-5";
          return s.href ? (
            <Link key={s.label} href={s.href} className={`${cls} block transition-colors hover:border-pink-strong/40 hover:bg-blush/10`}>
              {card}
            </Link>
          ) : (
            <div key={s.label} className={cls}>
              {card}
            </div>
          );
        })}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Recent orders */}
        <div className="lg:col-span-2 rounded-2xl border border-charcoal/10 bg-cream p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-xl">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm text-pink-strong hover:underline">
              View all
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="py-8 text-center text-sm text-graphite">No orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-graphite">
                    <th className="py-2">Ref</th>
                    <th className="py-2">Customer</th>
                    <th className="py-2">Channel</th>
                    <th className="py-2">Status</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((o) => (
                    <tr key={o.id} className="border-t border-charcoal/5">
                      <td className="py-3 font-medium">{o.ref}</td>
                      <td className="py-3">
                        {o.customerName}
                        <span className="block text-xs text-graphite">
                          {o.deliveryArea || getZone(o.deliveryZone).short}
                        </span>
                      </td>
                      <td className="py-3">{channelLabel(o.channel)}</td>
                      <td className="py-3">
                        <StatusPill status={o.status} />
                      </td>
                      <td className="py-3 text-right">{formatKES(o.total + o.deliveryFee)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Low stock */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-charcoal/10 bg-cream p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-xl">Stock alerts</h2>
              {lowStock.length > 0 && (
                <Link href="/admin/products?stock=low" className="text-sm text-pink-strong hover:underline">
                  View all
                </Link>
              )}
            </div>
            {lowStock.length === 0 ? (
              <p className="py-8 text-center text-sm text-graphite">Everything&apos;s well stocked.</p>
            ) : (
              <ul className="-mx-2 space-y-1">
                {lowStock.map((p) => (
                  <li key={p.id}>
                    {/* Opens the products table filtered to this piece, ready to restock */}
                    <Link
                      href={`/admin/products?q=${encodeURIComponent(p.name)}`}
                      className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-charcoal/5"
                    >
                      <span className="truncate">{p.name}</span>
                      <span
                        className={
                          p.inStock <= 0
                            ? "shrink-0 rounded-full bg-coral/15 px-2 py-0.5 text-xs font-medium text-coral"
                            : "shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700"
                        }
                      >
                        {p.inStock <= 0 ? "Out of stock" : `${p.inStock} left`}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Contact form enquiries. Stored as well as emailed, so nothing is
              lost while a mail provider is still being set up. */}
          <div className="rounded-2xl border border-charcoal/10 bg-cream p-5">
            <h2 className="mb-4 flex items-center gap-2 font-serif text-xl">
              <MessageSquare className="h-4 w-4 text-pink-strong" />
              Messages
            </h2>
            {messages.length === 0 ? (
              <p className="py-8 text-center text-sm text-graphite">
                No messages from the contact form yet.
              </p>
            ) : (
              <ul className="space-y-3">
                {messages.map((m) => (
                  <li key={m.id} className="border-b border-charcoal/5 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-medium">{m.name}</span>
                      <span className="shrink-0 text-xs text-graphite">
                        {new Date(m.createdAt).toLocaleDateString("en-KE", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-sm text-graphite">{m.message}</p>
                    <a
                      href={`mailto:${m.email}?subject=${encodeURIComponent("Re: your message to Alcove Atelier")}`}
                      className="mt-1 inline-block text-xs text-pink-strong hover:underline"
                    >
                      Reply to {m.email}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Link
            href="/admin/reports"
            className="flex items-center justify-between rounded-2xl border border-charcoal/10 bg-charcoal p-5 text-cream transition-colors hover:bg-pink-strong"
          >
            <span>
              <span className="block font-serif text-xl">Sales reports</span>
              <span className="text-sm text-cream/70">Weekly, monthly or yearly — download as CSV</span>
            </span>
            <ArrowRight className="h-5 w-5 shrink-0" />
          </Link>
        </div>
      </div>
    </AdminShell>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    new: "bg-blush/40 text-charcoal",
    confirmed: "bg-pink-strong/15 text-pink-strong",
    fulfilled: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-charcoal/10 text-graphite",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${map[status] ?? "bg-charcoal/10"}`}>
      {status}
    </span>
  );
}
