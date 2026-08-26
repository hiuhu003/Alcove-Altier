"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowDownToLine,
  Banknote,
  Clock,
  Loader2,
  Printer,
  Receipt,
  ShoppingCart,
  Truck,
  Users,
} from "lucide-react";
import { cn, formatKES } from "@/lib/utils";
import type { Period, SalesReport } from "@/lib/reports";

const PERIOD_TABS: { key: Period; label: string; noun: string; options: number[] }[] = [
  { key: "weekly", label: "Weekly", noun: "weeks", options: [4, 8, 12, 26, 52] },
  { key: "monthly", label: "Monthly", noun: "months", options: [3, 6, 12, 24] },
  { key: "yearly", label: "Yearly", noun: "years", options: [3, 5, 10] },
];

function plural(n: number, noun: string): string {
  return `${n} ${noun}${n === 1 ? "" : "s"}`;
}

export function ReportsClient({ initial }: { initial: SalesReport }) {
  const [period, setPeriod] = useState<Period>(initial.period);
  const [count, setCount] = useState(initial.count);
  const [report, setReport] = useState(initial);
  const [loading, setLoading] = useState(false);

  const tab = PERIOD_TABS.find((t) => t.key === period)!;

  async function load(nextPeriod: Period, nextCount: number) {
    setPeriod(nextPeriod);
    setCount(nextCount);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports?period=${nextPeriod}&count=${nextCount}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (data.ok) setReport(data.report);
    } catch {
      /* leave the previous report on screen */
    } finally {
      setLoading(false);
    }
  }

  function switchPeriod(next: Period) {
    const t = PERIOD_TABS.find((p) => p.key === next)!;
    // Land on a sensible window for the new granularity.
    load(next, t.options[Math.min(2, t.options.length - 1)]);
  }

  const s = report.summary;
  const maxGross = useMemo(
    () => Math.max(1, ...report.buckets.map((b) => b.gross)),
    [report.buckets]
  );
  const exportHref = `/api/admin/reports/export?period=${report.period}&count=${report.count}`;

  return (
    <div className={cn("transition-opacity", loading && "opacity-60")}>
      {/* Controls */}
      <div className="mb-6 flex flex-wrap items-center gap-3 print:hidden">
        <div className="flex rounded-full border border-charcoal/15 bg-cream p-1">
          {PERIOD_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => switchPeriod(t.key)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm transition-colors",
                period === t.key ? "bg-charcoal text-cream" : "text-graphite hover:text-charcoal"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-sm text-graphite">
          Showing last
          <select
            value={count}
            onChange={(e) => load(period, Number(e.target.value))}
            className="h-10 rounded-full border border-charcoal/15 bg-cream px-3 text-sm text-charcoal focus:border-pink-strong focus:outline-none"
          >
            {tab.options.map((o) => (
              <option key={o} value={o}>
                {o} {tab.noun}
              </option>
            ))}
          </select>
        </label>

        {loading && <Loader2 className="h-4 w-4 animate-spin text-pink-strong" />}

        <div className="ml-auto flex gap-2">
          <button
            onClick={() => window.print()}
            className="flex h-10 items-center gap-2 rounded-full border border-charcoal/15 px-4 text-sm text-graphite hover:border-charcoal hover:text-charcoal"
          >
            <Printer className="h-4 w-4" /> Print / PDF
          </button>
          <a
            href={exportHref}
            className="flex h-10 items-center gap-2 rounded-full bg-pink-strong px-5 text-sm font-medium text-white hover:bg-charcoal"
          >
            <ArrowDownToLine className="h-4 w-4" /> Download report
          </a>
        </div>
      </div>

      {/* Printed header */}
      <div className="mb-6">
        <h2 className="font-serif text-2xl">
          {tab.label} sales report
          <span className="ml-2 text-base text-graphite">{report.range.label}</span>
        </h2>
        <p className="mt-1 text-xs text-graphite">
          Generated {new Date(report.generatedAt).toLocaleString("en-KE")} · figures in KES ·
          cancelled orders excluded
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Gross sales" value={formatKES(s.gross)} sub={plural(s.orders, "order")} icon={Receipt} />
        <Kpi
          label="Collected"
          value={formatKES(s.collected)}
          sub={`${plural(s.paidOrders, "order")} paid`}
          icon={Banknote}
          tone="good"
        />
        <Kpi
          label="Awaiting payment"
          value={formatKES(s.outstanding)}
          sub={`${plural(s.pendingOrders, "order")} to follow up`}
          icon={Clock}
          tone={s.outstanding > 0 ? "warn" : undefined}
        />
        <Kpi
          label="Average order"
          value={formatKES(s.aov)}
          sub={`${plural(s.items, "item")} sold`}
          icon={ShoppingCart}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Customers" value={String(s.customers)} sub="unique buyers" icon={Users} />
        <Kpi label="Delivery fees" value={formatKES(s.delivery)} sub="charged on orders" icon={Truck} />
        <Kpi
          label={`Best ${tab.noun.replace(/s$/, "")}`}
          value={s.bestBucket ? s.bestBucket.label : "—"}
          sub={s.bestBucket ? formatKES(s.bestBucket.gross) : "no sales yet"}
          icon={Receipt}
        />
        <Kpi label="Cancelled" value={String(s.cancelled)} sub="excluded from totals" icon={Clock} />
      </div>

      {/* Trend */}
      <section className="mt-8 rounded-2xl border border-charcoal/10 bg-cream p-5">
        <h3 className="mb-5 font-serif text-xl">Sales trend</h3>
        {s.gross === 0 ? (
          <p className="py-10 text-center text-sm text-graphite">
            No sales recorded in this period yet.
          </p>
        ) : (
          <div className="flex h-52 items-end gap-1.5 overflow-x-auto pb-1">
            {report.buckets.map((b) => (
              <div key={b.key} className="flex min-w-[38px] flex-1 flex-col items-center gap-2">
                <span className="text-[10px] text-graphite">
                  {b.gross > 0 ? Math.round(b.gross / 1000) + "k" : ""}
                </span>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(2, (b.gross / maxGross) * 100)}%` }}
                  transition={{ duration: 0.4 }}
                  title={`${b.label}: ${formatKES(b.gross)} · ${b.orders} orders`}
                  className={cn(
                    "w-full rounded-t-md",
                    b.gross > 0 ? "bg-pink-strong/80" : "bg-charcoal/10"
                  )}
                />
                <span className="w-full truncate text-center text-[10px] text-graphite" title={b.label}>
                  {b.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Period table */}
      <Section title={`Breakdown by ${tab.noun.replace(/s$/, "")}`}>
        <Table
          head={["Period", "Orders", "Items", "Gross sales", "Delivery", "Collected", "Avg order"]}
          align={[0, 1, 1, 1, 1, 1, 1]}
          rows={report.buckets.map((b) => [
            b.label,
            String(b.orders),
            String(b.items),
            formatKES(b.gross),
            formatKES(b.delivery),
            formatKES(b.collected),
            formatKES(b.aov),
          ])}
          footer={[
            "Total",
            String(s.orders),
            String(s.items),
            formatKES(s.gross),
            formatKES(s.delivery),
            formatKES(s.collected),
            formatKES(s.aov),
          ]}
        />
      </Section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Section title="Best sellers">
          {report.topProducts.length === 0 ? (
            <Empty>No products sold in this period.</Empty>
          ) : (
            <Table
              head={["Product", "Units", "Sales"]}
              align={[0, 1, 1]}
              rows={report.topProducts.map((p) => [p.name, String(p.qty), formatKES(p.gross)])}
            />
          )}
        </Section>

        <Section title="How customers ordered">
          {report.channels.length === 0 ? (
            <Empty>No orders in this period.</Empty>
          ) : (
            <Table
              head={["Channel", "Orders", "Gross sales", "Collected"]}
              align={[0, 1, 1, 1]}
              rows={report.channels.map((c) => [
                c.label,
                String(c.orders),
                formatKES(c.gross),
                formatKES(c.collected),
              ])}
            />
          )}
        </Section>

        <Section title="Where it went">
          <Table
            head={["Delivery zone", "Orders", "Gross sales", "Delivery fees", "Pay on delivery"]}
            align={[0, 1, 1, 1, 1]}
            rows={report.zones.map((z) => [
              z.label,
              String(z.orders),
              formatKES(z.gross),
              formatKES(z.deliveryFees),
              String(z.payOnDelivery),
            ])}
          />
          <p className="mt-3 text-xs text-graphite">
            Nairobi &amp; environs orders can be paid on delivery. Outside Nairobi, the delivery fee
            depends on the destination and is confirmed before dispatch.
          </p>
        </Section>

        <Section title="Stock needing attention">
          {report.lowStock.length === 0 ? (
            <Empty>Everything is well stocked.</Empty>
          ) : (
            <Table
              head={["Product", "Category", "In stock"]}
              align={[0, 0, 1]}
              rows={report.lowStock.map((p) => [p.name, p.category, String(p.inStock)])}
            />
          )}
        </Section>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  icon: typeof Receipt;
  tone?: "good" | "warn";
}) {
  return (
    <div className="rounded-2xl border border-charcoal/10 bg-cream p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-graphite">{label}</span>
        <Icon
          className={cn(
            "h-5 w-5",
            tone === "good" ? "text-emerald-600" : tone === "warn" ? "text-coral" : "text-pink-strong"
          )}
        />
      </div>
      <p className="mt-3 font-serif text-2xl leading-tight">{value}</p>
      <p className="mt-1 text-xs text-graphite">{sub}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 rounded-2xl border border-charcoal/10 bg-cream p-5 lg:mt-0">
      <h3 className="mb-4 font-serif text-xl">{title}</h3>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-8 text-center text-sm text-graphite">{children}</p>;
}

function Table({
  head,
  rows,
  footer,
  align,
}: {
  head: string[];
  rows: string[][];
  footer?: string[];
  align: number[];
}) {
  const cls = (i: number) => (align[i] === 1 ? "text-right" : "text-left");
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-wider text-graphite">
            {head.map((h, i) => (
              <th key={h} className={cn("pb-2 font-medium", cls(i))}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} className="border-t border-charcoal/5">
              {r.map((c, i) => (
                <td key={i} className={cn("py-2.5", cls(i), i === 0 && "font-medium")}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {footer && (
          <tfoot>
            <tr className="border-t-2 border-charcoal/15 font-medium">
              {footer.map((c, i) => (
                <td key={i} className={cn("pt-3", cls(i))}>
                  {c}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
