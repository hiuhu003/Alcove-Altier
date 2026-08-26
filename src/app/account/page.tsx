import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Package, ShoppingBag } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { OrderTracker } from "@/components/account/OrderTracker";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { getCurrentUser } from "@/lib/users";
import { getOrdersForUser } from "@/lib/customer-orders";
import { formatKES } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/account");

  const orders = await getOrdersForUser(user.id);
  const spent = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total + (o.deliveryFee || 0), 0);

  return (
    <div className="container-x pb-24 pt-[calc(var(--header-h)+2rem)]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-graphite">Your account</p>
          <h1 className="mt-2 font-serif text-4xl sm:text-5xl">Hello, {user.name.split(" ")[0]}</h1>
          <p className="mt-2 text-graphite">{user.email}</p>
        </div>
        <SignOutButton />
      </div>

      {/* Summary */}
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Orders placed" value={String(orders.length)} icon={Package} />
        <SummaryCard label="Total spent" value={formatKES(spent)} icon={ShoppingBag} />
        <div className="rounded-2xl border border-charcoal/10 bg-white/50 p-5">
          <p className="text-sm text-graphite">Need something?</p>
          <ButtonLink href="/shop" variant="dark" className="mt-3 w-full">
            Continue shopping
          </ButtonLink>
        </div>
      </div>

      {/* Orders */}
      <h2 className="mt-14 font-serif text-2xl sm:text-3xl">Your orders</h2>
      {orders.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-charcoal/15 px-6 py-16 text-center">
          <p className="text-graphite">You haven&apos;t placed an order yet.</p>
          <ButtonLink href="/shop" variant="primary" size="lg" className="mt-6">
            Browse the collection
          </ButtonLink>
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {orders.map((order, i) => (
            <OrderTracker key={order.ref} order={order} defaultOpen={i === 0} />
          ))}
        </div>
      )}

      <p className="mt-10 text-sm text-graphite">
        Placed an order as a guest?{" "}
        <Link href="/track" className="text-pink-strong underline underline-offset-4">
          Track it with its reference
        </Link>
        .
      </p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Package;
}) {
  return (
    <div className="rounded-2xl border border-charcoal/10 bg-white/50 p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-graphite">{label}</span>
        <Icon className="h-5 w-5 text-pink-strong" />
      </div>
      <p className="mt-3 font-serif text-3xl">{value}</p>
    </div>
  );
}
