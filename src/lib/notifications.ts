import "server-only";
import { prisma } from "./prisma";
import { formatKES, channelLabel } from "./utils";
import { zoneLabel } from "./delivery";
import { LOW_STOCK_THRESHOLD } from "./stock";

/**
 * Admin alerts.
 *
 * Every alert is a row in the Notification table, surfaced by the bell in the
 * admin header. Recurring conditions carry a `dedupeKey` (unique) so the same
 * "X is out of stock" never stacks up — it is raised once and cleared when the
 * condition goes away (e.g. the product is restocked).
 */

export { LOW_STOCK_THRESHOLD };

export type NotificationRow = {
  id: string;
  type: string;
  level: string;
  title: string;
  body: string;
  href: string | null;
  read: boolean;
  createdAt: string;
};

type RaiseInput = {
  type: string;
  title: string;
  body?: string;
  href?: string;
  level?: "info" | "warning" | "critical";
  dedupeKey?: string;
};

/** Create an alert. Never throws — a failed alert must not fail an order. */
export async function raise(input: RaiseInput): Promise<void> {
  try {
    const data = {
      type: input.type,
      title: input.title,
      body: input.body ?? "",
      href: input.href ?? null,
      level: input.level ?? "info",
      dedupeKey: input.dedupeKey ?? null,
    };
    if (input.dedupeKey) {
      // Idempotent: re-raising an active condition refreshes the wording (e.g.
      // "2 left" → "1 left") but keeps its place in the list and its read flag.
      await prisma.notification.upsert({
        where: { dedupeKey: input.dedupeKey },
        create: data,
        update: { title: data.title, body: data.body, href: data.href, level: data.level },
      });
    } else {
      await prisma.notification.create({ data });
    }
  } catch (err) {
    console.error("[alerts] could not raise notification:", err);
  }
}

/** Clear alerts by dedupe key (condition resolved). */
async function clear(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  try {
    await prisma.notification.deleteMany({ where: { dedupeKey: { in: keys } } });
  } catch {
    /* non-critical */
  }
}

// --- Order alerts ------------------------------------------------------------

export async function notifyNewOrder(order: {
  id: string;
  ref: string;
  customerName: string;
  channel: string;
  total: number;
  deliveryZone: string;
  payOnDelivery: boolean;
  items: { name: string; qty: number }[];
}): Promise<void> {
  const count = order.items.reduce((n, i) => n + i.qty, 0);
  const pieces = order.items
    .map((i) => `${i.name} ×${i.qty}`)
    .slice(0, 3)
    .join(", ");
  await raise({
    type: "order.new",
    level: "info",
    title: `New order ${order.ref} · ${formatKES(order.total)}`,
    body: `${order.customerName} · ${count} ${count === 1 ? "item" : "items"} · ${channelLabel(
      order.channel
    )} · ${zoneLabel(order.deliveryZone)}${pieces ? ` — ${pieces}` : ""}`,
    href: "/admin/orders",
  });
}

export async function notifyOrderPaid(order: {
  ref: string;
  total: number;
  paymentRef?: string | null;
}): Promise<void> {
  await raise({
    type: "order.paid",
    level: "info",
    title: `Payment received · ${order.ref}`,
    body: `${formatKES(order.total)} confirmed${order.paymentRef ? ` (${order.paymentRef})` : ""}.`,
    href: "/admin/orders",
  });
}

// --- Stock alerts ------------------------------------------------------------

const outKey = (id: string) => `stock:out:${id}`;
const lowKey = (id: string) => `stock:low:${id}`;

/** Opens the products table filtered down to the product in question. */
const productHref = (name: string) => `/admin/products?q=${encodeURIComponent(name)}`;

/**
 * Raise/clear the stock alerts for one product based on its current level.
 * Bespoke (made-to-order) products are skipped — they have no stock to run out.
 */
export async function reviewStockFor(productId: string): Promise<void> {
  try {
    const p = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, inStock: true, bespoke: true, published: true },
    });
    if (!p || p.bespoke) {
      await clear([outKey(productId), lowKey(productId)]);
      return;
    }
    if (p.inStock <= 0) {
      await clear([lowKey(p.id)]);
      await raise({
        type: "stock.out",
        level: "critical",
        title: `Out of stock · ${p.name}`,
        body: "This piece is showing 0 left — restock it or unpublish it so customers don't order it.",
        href: productHref(p.name),
        dedupeKey: outKey(p.id),
      });
    } else if (p.inStock <= LOW_STOCK_THRESHOLD) {
      await clear([outKey(p.id)]);
      await raise({
        type: "stock.low",
        level: "warning",
        title: `Low stock · ${p.name}`,
        body: `Only ${p.inStock} left in stock.`,
        href: productHref(p.name),
        dedupeKey: lowKey(p.id),
      });
    } else {
      await clear([outKey(p.id), lowKey(p.id)]);
    }
  } catch (err) {
    console.error("[alerts] stock review failed:", err);
  }
}

/**
 * Sweep the whole catalogue and bring stock alerts in line with reality.
 * Cheap and idempotent — called whenever the admin loads their alerts, so
 * stock edited outside the app (or seeded) still raises an alert.
 */
export async function syncStockAlerts(): Promise<void> {
  try {
    const products = await prisma.product.findMany({
      where: { bespoke: false, published: true },
      select: { id: true, name: true, inStock: true },
    });

    const active = new Map<string, { id: string; name: string; inStock: number }>();
    for (const p of products) {
      if (p.inStock <= LOW_STOCK_THRESHOLD) active.set(p.id, p);
    }

    // Clear alerts whose product is restocked, unpublished, deleted or bespoke.
    const existing = await prisma.notification.findMany({
      where: { type: { in: ["stock.out", "stock.low"] } },
      select: { id: true, type: true, dedupeKey: true },
    });
    const stale = existing.filter((n) => {
      const id = n.dedupeKey?.split(":")[2];
      if (!id) return true;
      const p = active.get(id);
      if (!p) return true;
      return n.type === "stock.out" ? p.inStock > 0 : p.inStock <= 0;
    });
    if (stale.length > 0) {
      await prisma.notification.deleteMany({ where: { id: { in: stale.map((s) => s.id) } } });
    }

    for (const p of active.values()) {
      if (p.inStock <= 0) {
        await raise({
          type: "stock.out",
          level: "critical",
          title: `Out of stock · ${p.name}`,
          body: "This piece is showing 0 left — restock it or unpublish it so customers don't order it.",
          href: productHref(p.name),
          dedupeKey: outKey(p.id),
        });
      } else {
        await raise({
          type: "stock.low",
          level: "warning",
          title: `Low stock · ${p.name}`,
          body: `Only ${p.inStock} left in stock.`,
          href: productHref(p.name),
          dedupeKey: lowKey(p.id),
        });
      }
    }
  } catch (err) {
    console.error("[alerts] stock sync failed:", err);
  }
}

// --- Reads / writes for the admin UI ----------------------------------------

export async function listNotifications(limit = 30): Promise<{
  items: NotificationRow[];
  unread: number;
}> {
  const [rows, unread] = await Promise.all([
    prisma.notification.findMany({ orderBy: { createdAt: "desc" }, take: limit }),
    prisma.notification.count({ where: { read: false } }),
  ]);
  return {
    unread,
    items: rows.map((n) => ({
      id: n.id,
      type: n.type,
      level: n.level,
      title: n.title,
      body: n.body,
      href: n.href,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
    })),
  };
}

export async function markRead(ids?: string[]): Promise<void> {
  await prisma.notification.updateMany({
    where: ids && ids.length > 0 ? { id: { in: ids } } : { read: false },
    data: { read: true },
  });
}

/** Dismiss alerts. Stock alerts come back on the next sweep if still true. */
export async function dismiss(ids?: string[]): Promise<void> {
  await prisma.notification.deleteMany({
    where: ids && ids.length > 0 ? { id: { in: ids } } : {},
  });
}
