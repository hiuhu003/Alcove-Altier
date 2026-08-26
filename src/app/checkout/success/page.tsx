import type { Metadata } from "next";
import Link from "next/link";
import { Check, Package, Truck } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { ClearCart } from "@/components/checkout/ClearCart";
import { LogoMark } from "@/components/Logo";
import { SITE } from "@/lib/site";
import { DELIVERY_POLICY } from "@/lib/delivery";
import { getCurrentUser } from "@/lib/users";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order received",
  robots: { index: false, follow: false },
};

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; method?: string; pending?: string }>;
}) {
  const { ref, method, pending } = await searchParams;
  const user = await getCurrentUser();

  const message =
    method === "cod"
      ? "Thank you! We'll call you shortly to confirm your order and the delivery time. Payment is made when your order arrives — cash or M-Pesa to the rider."
      : method === "whatsapp"
        ? "We've opened WhatsApp with your order — send us the message and we'll confirm details and lead time right away."
        : method === "mpesa" && pending
          ? `Thank you! If you've already paid to our M-Pesa Paybill (${SITE.mpesa.paybill}, Acc ${SITE.mpesa.account}), we'll match your payment and confirm shortly. If not, please complete it now — then we'll be in touch on WhatsApp.`
          : "Thank you! Your payment was successful and your order is confirmed. We'll be in touch shortly.";

  return (
    <div className="container-x grid min-h-[70vh] place-items-center py-24 text-center">
      <ClearCart />
      <div className="w-full max-w-lg">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-coral text-white">
          <Check className="h-10 w-10" strokeWidth={2.5} />
        </div>
        <h1 className="mt-8 font-serif text-4xl sm:text-5xl">Order received</h1>

        {ref && (
          <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-charcoal/10 bg-white/60 px-5 py-4">
            <p className="text-xs uppercase tracking-[0.18em] text-graphite">
              Your order reference
            </p>
            <p className="mt-1 font-serif text-3xl tracking-wide text-charcoal">{ref}</p>
            <p className="mt-2 text-xs text-graphite">
              Keep this — it&apos;s how you track your order.
            </p>
          </div>
        )}

        <p className="mt-6 leading-relaxed text-graphite">{message}</p>

        {/* What happens next — the question every customer has at this point. */}
        <ol className="mx-auto mt-8 max-w-sm space-y-3 text-left">
          <NextStep icon={Check} title="Order received" done>
            We have your details.
          </NextStep>
          <NextStep icon={Package} title="We confirm with you">
            A quick call or WhatsApp to confirm items, delivery and any fee.
          </NextStep>
          <NextStep icon={Truck} title="On its way">
            {method === "cod"
              ? "Pay the rider when your order arrives."
              : "We'll let you know as soon as it's out for delivery."}
          </NextStep>
        </ol>

        <div className="mt-8 rounded-2xl bg-sand px-5 py-4 text-left text-sm text-graphite">
          <p className="mb-1 font-medium text-charcoal">{DELIVERY_POLICY.headline}</p>
          <p>{DELIVERY_POLICY.nairobi}</p>
          <p className="mt-1">{DELIVERY_POLICY.outside}</p>
        </div>

        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <ButtonLink
            href={user ? "/account" : `/track${ref ? `?ref=${encodeURIComponent(ref)}` : ""}`}
            variant="primary"
            size="lg"
          >
            Track your order
          </ButtonLink>
          <ButtonLink href="/shop" variant="outline" size="lg">
            Continue shopping
          </ButtonLink>
        </div>

        {!user && (
          <p className="mt-6 text-sm text-graphite">
            <Link href="/signup" className="text-pink-strong underline underline-offset-4">
              Create an account
            </Link>{" "}
            to keep all your orders in one place.
          </p>
        )}

        <div className="mt-12 flex items-center justify-center gap-2 text-coral/40">
          <LogoMark className="h-10" />
        </div>
        <p className="mt-2 text-sm text-graphite">
          Questions?{" "}
          <Link href="/contact" className="text-coral underline underline-offset-4">
            Contact us
          </Link>
        </p>
      </div>
    </div>
  );
}

function NextStep({
  icon: Icon,
  title,
  children,
  done = false,
}: {
  icon: typeof Check;
  title: string;
  children: React.ReactNode;
  done?: boolean;
}) {
  return (
    <li className="flex gap-3">
      <span
        className={
          done
            ? "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-pink-strong text-white"
            : "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-charcoal/15 bg-cream text-graphite"
        }
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="text-sm">
        <span className="block font-medium text-charcoal">{title}</span>
        <span className="text-graphite">{children}</span>
      </span>
    </li>
  );
}
