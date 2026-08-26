import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { ClearCart } from "@/components/checkout/ClearCart";
import { LogoMark } from "@/components/Logo";
import { SITE } from "@/lib/site";
import { DELIVERY_POLICY } from "@/lib/delivery";

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
      <div className="max-w-lg">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-coral text-white">
          <Check className="h-10 w-10" strokeWidth={2.5} />
        </div>
        <h1 className="mt-8 font-serif text-4xl sm:text-5xl">Order received</h1>
        {ref && (
          <p className="mt-3 text-graphite">
            Your reference is <strong className="text-charcoal">{ref}</strong> — keep it handy.
          </p>
        )}
        <p className="mt-4 leading-relaxed text-graphite">{message}</p>

        <div className="mt-6 rounded-2xl bg-sand px-5 py-4 text-left text-sm text-graphite">
          <p className="mb-1 font-medium text-charcoal">{DELIVERY_POLICY.headline}</p>
          <p>{DELIVERY_POLICY.nairobi}</p>
          <p className="mt-1">{DELIVERY_POLICY.outside}</p>
        </div>

        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/shop" variant="primary" size="lg">
            Continue shopping
          </ButtonLink>
          <ButtonLink href="/" variant="outline" size="lg">
            Back to home
          </ButtonLink>
        </div>

        <div className="mt-12 flex items-center justify-center gap-2 text-coral/40">
          <LogoMark className="h-10" />
        </div>
        <p className="mt-2 text-sm text-graphite">
          Questions? <Link href="/contact" className="text-coral underline underline-offset-4">Contact us</Link>
        </p>
      </div>
    </div>
  );
}
