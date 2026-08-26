import Link from "next/link";
import { Mail, MapPin, Phone, Truck } from "lucide-react";
import { InstagramIcon } from "@/components/icons/Brand";
import { Logo } from "@/components/Logo";
import { NAV_LINKS, SITE } from "@/lib/site";
import { getCategories } from "@/lib/products";
import { NewsletterForm } from "./NewsletterForm";

export async function Footer() {
  const categories = await getCategories();
  return (
    <footer className="mt-24 bg-charcoal text-cream/80">
      <div className="h-1 w-full bg-gradient-to-r from-pink-strong via-pink to-coral" />
      <div className="container-x py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <div className="text-cream">
              <Logo className="[&_*]:!text-cream" stacked={false} />
            </div>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-cream/60">
              {SITE.longDesc}
            </p>
            <div className="mt-6 flex gap-3">
              <a
                href={SITE.socials.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="grid h-10 w-10 place-items-center rounded-full border border-cream/20 transition-colors hover:border-pink-strong hover:bg-pink-strong hover:text-white"
              >
                <InstagramIcon className="h-4 w-4" />
              </a>
              <a
                href={`mailto:${SITE.email}`}
                aria-label="Email"
                className="grid h-10 w-10 place-items-center rounded-full border border-cream/20 transition-colors hover:border-pink-strong hover:bg-pink-strong hover:text-white"
              >
                <Mail className="h-4 w-4" />
              </a>
              <a
                href={`tel:${SITE.phoneE164}`}
                aria-label="Call"
                className="grid h-10 w-10 place-items-center rounded-full border border-cream/20 transition-colors hover:border-pink-strong hover:bg-pink-strong hover:text-white"
              >
                <Phone className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="mb-5 font-sans text-xs font-semibold uppercase tracking-[0.24em] text-cream">
              Explore
            </h4>
            <ul className="space-y-3 text-sm">
              {NAV_LINKS.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-cream/60 transition-colors hover:text-pink-strong">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-5 font-sans text-xs font-semibold uppercase tracking-[0.24em] text-cream">
              Shop
            </h4>
            <ul className="space-y-3 text-sm">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/shop?category=${c.slug}`}
                    className="text-cream/60 transition-colors hover:text-pink-strong"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-5 font-sans text-xs font-semibold uppercase tracking-[0.24em] text-cream">
              Stay in touch
            </h4>
            <p className="mb-4 text-sm text-cream/60">
              New pieces, occasional offers. No spam.
            </p>
            <NewsletterForm />
            <div className="mt-6 space-y-2 text-sm text-cream/60">
              <a href={`tel:${SITE.phoneE164}`} className="block hover:text-pink-strong">
                {SITE.phoneDisplay}
              </a>
              <a href={`mailto:${SITE.email}`} className="block hover:text-pink-strong">
                {SITE.email}
              </a>
            </div>
          </div>
        </div>

        {/* Delivery terms — the two things every customer asks about */}
        <div className="mt-14 grid gap-4 rounded-2xl border border-cream/10 bg-cream/[0.03] p-6 sm:grid-cols-2">
          <div className="flex gap-3">
            <Truck className="mt-0.5 h-4 w-4 shrink-0 text-pink-strong" />
            <p className="text-sm text-cream/60">
              <span className="font-medium text-cream">Nairobi &amp; environs</span>
              <br />
              We deliver to your door — pay on delivery.
            </p>
          </div>
          <div className="flex gap-3">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-pink-strong" />
            <p className="text-sm text-cream/60">
              <span className="font-medium text-cream">Outside Nairobi</span>
              <br />
              Delivered countrywide — fee depends on your location.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-cream/10 pt-8 text-xs text-cream/40 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {SITE.legalName}. Handmade in {SITE.country}.
          </p>
          <div className="flex gap-6">
            <Link href="/about" className="hover:text-cream">About</Link>
            <Link href="/contact" className="hover:text-cream">Contact</Link>
            <Link href="/admin" className="hover:text-cream">Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
