import "server-only";
import { prisma } from "./prisma";
import { channelLabel, formatKES } from "./utils";
import { DELIVERY_ZONES, zoneLabel } from "./delivery";
import { LOW_STOCK_THRESHOLD } from "./stock";

/**
 * Sales reporting for the admin.
 *
 * One report = a period type (weekly / monthly / yearly), which decides both
 * the window covered and how rows are bucketed, e.g. "weekly × 12" is the last
 * 12 weeks, one row per week. Everything is computed in server-local time
 * (EAT for the shop) from the orders table.
 *
 * Cancelled orders are excluded from sales figures and reported separately.
 * "Gross sales" counts every live order; "collected" counts only orders whose
 * payment is confirmed — the gap is what still needs following up.
 */

export type Period = "weekly" | "monthly" | "yearly";

export const PERIODS: { key: Period; label: string; noun: string; defaultCount: number }[] = [
  { key: "weekly", label: "Weekly", noun: "week", defaultCount: 12 },
  { key: "monthly", label: "Monthly", noun: "month", defaultCount: 12 },
  { key: "yearly", label: "Yearly", noun: "year", defaultCount: 5 },
];

export type Bucket = {
  key: string;
  label: string;
  start: string;
  end: string;
  orders: number;
  paidOrders: number;
  cancelled: number;
  items: number;
  gross: number;
  collected: number;
  delivery: number;
  aov: number;
};

export type Breakdown = {
  key: string;
  label: string;
  orders: number;
  gross: number;
  collected: number;
};

export type SalesReport = {
  period: Period;
  count: number;
  range: { start: string; end: string; label: string };
  generatedAt: string;
  summary: {
    orders: number;
    paidOrders: number;
    pendingOrders: number;
    cancelled: number;
    items: number;
    gross: number;
    collected: number;
    outstanding: number;
    delivery: number;
    aov: number;
    customers: number;
    bestBucket: { label: string; gross: number } | null;
  };
  buckets: Bucket[];
  topProducts: { name: string; qty: number; gross: number; orders: number }[];
  channels: Breakdown[];
  zones: (Breakdown & { deliveryFees: number; payOnDelivery: number })[];
  statuses: Breakdown[];
  lowStock: { name: string; category: string; inStock: number }[];
};

// --- date helpers ------------------------------------------------------------

const DAY = 86_400_000;

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Monday-based week start. */
function startOfWeek(d: Date): Date {
  const x = startOfDay(d);
  const dow = (x.getDay() + 6) % 7; // Mon = 0
  x.setDate(x.getDate() - dow);
  return x;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function startOfYear(d: Date): Date {
  return new Date(d.getFullYear(), 0, 1);
}

function periodStart(period: Period, d: Date): Date {
  return period === "weekly" ? startOfWeek(d) : period === "monthly" ? startOfMonth(d) : startOfYear(d);
}

function addPeriods(period: Period, d: Date, n: number): Date {
  if (period === "weekly") return new Date(d.getTime() + n * 7 * DAY);
  if (period === "monthly") return new Date(d.getFullYear(), d.getMonth() + n, 1);
  return new Date(d.getFullYear() + n, 0, 1);
}

const fmtDay = new Intl.DateTimeFormat("en-KE", { day: "numeric", month: "short" });
const fmtDayYear = new Intl.DateTimeFormat("en-KE", { day: "numeric", month: "short", year: "numeric" });
const fmtMonth = new Intl.DateTimeFormat("en-KE", { month: "short", year: "numeric" });

function bucketKey(period: Period, start: Date): string {
  const y = start.getFullYear();
  if (period === "yearly") return String(y);
  if (period === "monthly") return `${y}-${String(start.getMonth() + 1).padStart(2, "0")}`;
  return `${y}-W${String(isoWeek(start)).padStart(2, "0")}`;
}

function isoWeek(d: Date): number {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + 3 - ((x.getDay() + 6) % 7));
  const week1 = new Date(x.getFullYear(), 0, 4);
  return 1 + Math.round(((x.getTime() - week1.getTime()) / DAY - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

function bucketLabel(period: Period, start: Date): string {
  if (period === "yearly") return String(start.getFullYear());
  if (period === "monthly") return fmtMonth.format(start);
  const end = new Date(start.getTime() + 6 * DAY);
  return `${fmtDay.format(start)} – ${fmtDay.format(end)}`;
}

// --- report builder ----------------------------------------------------------

export function resolveRange(period: Period, count: number, now = new Date()) {
  const currentStart = periodStart(period, now);
  const start = addPeriods(period, currentStart, -(count - 1));
  const end = addPeriods(period, currentStart, 1); // exclusive
  const label = `${fmtDayYear.format(start)} – ${fmtDayYear.format(new Date(end.getTime() - 1))}`;
  return { start, end, label };
}

export function periodCount(period: Period, requested?: number): number {
  const def = PERIODS.find((p) => p.key === period)?.defaultCount ?? 12;
  if (!requested || !Number.isFinite(requested)) return def;
  return Math.min(Math.max(Math.trunc(requested), 1), period === "yearly" ? 10 : 52);
}

export async function buildSalesReport(
  period: Period,
  requestedCount?: number
): Promise<SalesReport> {
  const count = periodCount(period, requestedCount);
  const { start, end, label } = resolveRange(period, count);

  const [orders, lowStock] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: start, lt: end } },
      orderBy: { createdAt: "asc" },
      include: { items: true },
    }),
    prisma.product.findMany({
      where: { bespoke: false, published: true, inStock: { lte: LOW_STOCK_THRESHOLD } },
      orderBy: { inStock: "asc" },
      select: { name: true, category: true, inStock: true },
      take: 50,
    }),
  ]);

  // Pre-seed every bucket so quiet weeks/months still show as zero rows.
  const buckets = new Map<string, Bucket>();
  for (let i = 0; i < count; i++) {
    const bStart = addPeriods(period, periodStart(period, start), i);
    const bEnd = addPeriods(period, bStart, 1);
    buckets.set(bucketKey(period, bStart), {
      key: bucketKey(period, bStart),
      label: bucketLabel(period, bStart),
      start: bStart.toISOString(),
      end: new Date(bEnd.getTime() - 1).toISOString(),
      orders: 0,
      paidOrders: 0,
      cancelled: 0,
      items: 0,
      gross: 0,
      collected: 0,
      delivery: 0,
      aov: 0,
    });
  }

  const products = new Map<string, { name: string; qty: number; gross: number; orders: number }>();
  const channels = new Map<string, Breakdown>();
  const statuses = new Map<string, Breakdown>();
  const zones = new Map<string, Breakdown & { deliveryFees: number; payOnDelivery: number }>();
  for (const z of DELIVERY_ZONES) {
    zones.set(z.key, {
      key: z.key,
      label: z.label,
      orders: 0,
      gross: 0,
      collected: 0,
      deliveryFees: 0,
      payOnDelivery: 0,
    });
  }

  const customers = new Set<string>();
  let totalOrders = 0;
  let paidOrders = 0;
  let cancelled = 0;
  let items = 0;
  let gross = 0;
  let collected = 0;
  let delivery = 0;

  for (const o of orders) {
    const isCancelled = o.status === "cancelled";
    const isPaid = o.paymentStatus === "paid";
    const bucket = buckets.get(bucketKey(period, periodStart(period, o.createdAt)));
    const qty = o.items.reduce((n, i) => n + i.qty, 0);
    const fee = o.deliveryFee ?? 0;

    if (isCancelled) {
      cancelled++;
      if (bucket) bucket.cancelled++;
      continue;
    }

    totalOrders++;
    items += qty;
    gross += o.total;
    delivery += fee;
    if (isPaid) {
      paidOrders++;
      collected += o.total + fee;
    }
    customers.add((o.email || o.phone).toLowerCase());

    if (bucket) {
      bucket.orders++;
      bucket.items += qty;
      bucket.gross += o.total;
      bucket.delivery += fee;
      if (isPaid) {
        bucket.paidOrders++;
        bucket.collected += o.total + fee;
      }
    }

    for (const it of o.items) {
      const p = products.get(it.name) ?? { name: it.name, qty: 0, gross: 0, orders: 0 };
      p.qty += it.qty;
      p.gross += it.price * it.qty;
      p.orders += 1;
      products.set(it.name, p);
    }

    const ch = channels.get(o.channel) ?? {
      key: o.channel,
      label: channelLabel(o.channel),
      orders: 0,
      gross: 0,
      collected: 0,
    };
    ch.orders++;
    ch.gross += o.total;
    if (isPaid) ch.collected += o.total + fee;
    channels.set(o.channel, ch);

    const st = statuses.get(o.status) ?? {
      key: o.status,
      label: o.status,
      orders: 0,
      gross: 0,
      collected: 0,
    };
    st.orders++;
    st.gross += o.total;
    if (isPaid) st.collected += o.total + fee;
    statuses.set(o.status, st);

    const zoneKey = o.deliveryZone || "nairobi";
    const zn =
      zones.get(zoneKey) ??
      ({
        key: zoneKey,
        label: zoneLabel(zoneKey),
        orders: 0,
        gross: 0,
        collected: 0,
        deliveryFees: 0,
        payOnDelivery: 0,
      } as Breakdown & { deliveryFees: number; payOnDelivery: number });
    zn.orders++;
    zn.gross += o.total;
    zn.deliveryFees += fee;
    if (o.payOnDelivery) zn.payOnDelivery++;
    if (isPaid) zn.collected += o.total + fee;
    zones.set(zoneKey, zn);
  }

  const bucketList = [...buckets.values()].map((b) => ({
    ...b,
    aov: b.orders > 0 ? Math.round(b.gross / b.orders) : 0,
  }));

  const best = bucketList.reduce<Bucket | null>(
    (acc, b) => (b.gross > 0 && (!acc || b.gross > acc.gross) ? b : acc),
    null
  );

  return {
    period,
    count,
    range: { start: start.toISOString(), end: new Date(end.getTime() - 1).toISOString(), label },
    generatedAt: new Date().toISOString(),
    summary: {
      orders: totalOrders,
      paidOrders,
      pendingOrders: totalOrders - paidOrders,
      cancelled,
      items,
      gross,
      collected,
      outstanding: gross + delivery - collected,
      delivery,
      aov: totalOrders > 0 ? Math.round(gross / totalOrders) : 0,
      customers: customers.size,
      bestBucket: best ? { label: best.label, gross: best.gross } : null,
    },
    buckets: bucketList,
    topProducts: [...products.values()].sort((a, b) => b.gross - a.gross).slice(0, 15),
    channels: [...channels.values()].sort((a, b) => b.gross - a.gross),
    zones: [...zones.values()],
    statuses: [...statuses.values()].sort((a, b) => b.orders - a.orders),
    lowStock: lowStock.map((p) => ({ name: p.name, category: p.category, inStock: p.inStock })),
  };
}

// --- CSV export --------------------------------------------------------------

function esc(value: string | number): string {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function row(...cells: (string | number)[]): string {
  return cells.map(esc).join(",");
}

/**
 * A single, Excel-friendly CSV with each section stacked under a heading —
 * the client opens it straight from the download and can chart or file it.
 * Money columns are plain numbers (KES) so they stay summable in a spreadsheet.
 */
export function reportToCsv(report: SalesReport, shopName: string): string {
  const periodNoun = PERIODS.find((p) => p.key === report.period)?.noun ?? "period";
  const lines: string[] = [];

  lines.push(row(`${shopName} — Sales report`));
  lines.push(row("Report type", `${report.period} (per ${periodNoun})`));
  lines.push(row("Period covered", report.range.label));
  lines.push(row("Generated", new Date(report.generatedAt).toLocaleString("en-KE")));
  lines.push(row("Currency", "KES"));
  lines.push("");

  lines.push(row("SUMMARY"));
  lines.push(row("Metric", "Value"));
  lines.push(row("Orders (excl. cancelled)", report.summary.orders));
  lines.push(row("Items sold", report.summary.items));
  lines.push(row("Gross sales (goods)", report.summary.gross));
  lines.push(row("Delivery fees", report.summary.delivery));
  lines.push(row("Collected (payment confirmed)", report.summary.collected));
  lines.push(row("Outstanding (awaiting payment)", report.summary.outstanding));
  lines.push(row("Average order value", report.summary.aov));
  lines.push(row("Paid orders", report.summary.paidOrders));
  lines.push(row("Unpaid orders", report.summary.pendingOrders));
  lines.push(row("Cancelled orders", report.summary.cancelled));
  lines.push(row("Customers", report.summary.customers));
  if (report.summary.bestBucket) {
    lines.push(row(`Best ${periodNoun}`, `${report.summary.bestBucket.label} (${report.summary.bestBucket.gross})`));
  }
  lines.push("");

  lines.push(row(`SALES BY ${periodNoun.toUpperCase()}`));
  lines.push(
    row(
      periodNoun.charAt(0).toUpperCase() + periodNoun.slice(1),
      "Orders",
      "Items",
      "Gross sales",
      "Delivery fees",
      "Collected",
      "Avg order value",
      "Paid orders",
      "Cancelled"
    )
  );
  for (const b of report.buckets) {
    lines.push(row(b.label, b.orders, b.items, b.gross, b.delivery, b.collected, b.aov, b.paidOrders, b.cancelled));
  }
  lines.push("");

  lines.push(row("TOP PRODUCTS"));
  lines.push(row("Product", "Units sold", "Sales value", "Times ordered"));
  for (const p of report.topProducts) lines.push(row(p.name, p.qty, p.gross, p.orders));
  if (report.topProducts.length === 0) lines.push(row("No sales in this period"));
  lines.push("");

  lines.push(row("SALES BY CHANNEL"));
  lines.push(row("Channel", "Orders", "Gross sales", "Collected"));
  for (const c of report.channels) lines.push(row(c.label, c.orders, c.gross, c.collected));
  lines.push("");

  lines.push(row("SALES BY DELIVERY ZONE"));
  lines.push(row("Zone", "Orders", "Gross sales", "Delivery fees", "Pay-on-delivery orders", "Collected"));
  for (const z of report.zones) {
    lines.push(row(z.label, z.orders, z.gross, z.deliveryFees, z.payOnDelivery, z.collected));
  }
  lines.push("");

  lines.push(row("ORDER STATUS"));
  lines.push(row("Status", "Orders", "Gross sales"));
  for (const s of report.statuses) lines.push(row(s.label, s.orders, s.gross));
  lines.push("");

  lines.push(row("STOCK NEEDING ATTENTION"));
  lines.push(row("Product", "Category", "In stock"));
  for (const p of report.lowStock) lines.push(row(p.name, p.category, p.inStock));
  if (report.lowStock.length === 0) lines.push(row("Everything is well stocked"));

  // BOM so Excel reads UTF-8 (KSh, names with accents) correctly.
  return "﻿" + lines.join("\r\n");
}

export function reportFilename(report: SalesReport): string {
  const stamp = new Date(report.generatedAt).toISOString().slice(0, 10);
  return `alcove-atelier-sales-${report.period}-${stamp}.csv`;
}

/** Used by the print/PDF view and the on-screen tables. */
export function money(n: number): string {
  return formatKES(n);
}
