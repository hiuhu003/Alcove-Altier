import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone, Truck } from "lucide-react";
import { ContactForm } from "@/components/contact/ContactForm";
import { InstagramIcon } from "@/components/icons/Brand";
import { Reveal } from "@/components/motion/Reveal";
import { SITE } from "@/lib/site";
import { waLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Alcove Atelier — WhatsApp, call or email us to enquire about custom mirrors and bespoke décor in Kenya.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const cards = [
    {
      icon: () => (
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.1-1.3c1.4.8 3.1 1.2 4.9 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2z" /></svg>
      ),
      label: "WhatsApp",
      value: "Chat with us",
      href: waLink(`Hi ${SITE.name}! I'd like to enquire about your pieces.`),
      external: true,
      accent: true,
    },
    { icon: Phone, label: "Call", value: SITE.phoneDisplay, href: `tel:${SITE.phoneE164}` },
    { icon: Mail, label: "Email", value: SITE.email, href: `mailto:${SITE.email}` },
    { icon: InstagramIcon, label: "Instagram", value: "@alcove_atelier_ke", href: SITE.socials.instagram, external: true },
  ];

  return (
    <div className="pt-[calc(var(--header-h)+3rem)]">
      <div className="container-x">
        <div className="max-w-2xl">
          <p className="eyebrow mb-4">Get in touch</p>
          <h1 className="font-serif text-5xl leading-tight sm:text-6xl">
            Let&apos;s make something for your home
          </h1>
          <p className="mt-5 text-lg text-graphite">
            Have a piece in mind or a space to fill? Message us on WhatsApp for the
            fastest reply, or send a note below.
          </p>
        </div>

        <div className="mt-14 grid gap-12 lg:grid-cols-2">
          {/* Contact cards + info */}
          <div>
            <div className="grid gap-4 sm:grid-cols-2">
              {cards.map((c, i) => {
                const Icon = c.icon;
                return (
                  <Reveal key={c.label} delay={i}>
                    <a
                      href={c.href}
                      target={c.external ? "_blank" : undefined}
                      rel={c.external ? "noopener noreferrer" : undefined}
                      className={`group flex items-center gap-4 rounded-2xl border p-5 transition-all hover:-translate-y-0.5 ${
                        c.accent
                          ? "border-transparent bg-[#25D366] text-white"
                          : "border-charcoal/10 bg-white/40 hover:border-charcoal/30"
                      }`}
                    >
                      <span
                        className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${
                          c.accent ? "bg-white/20" : "bg-pink-strong/10 text-pink-strong"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <span>
                        <span className={`block text-xs uppercase tracking-wider ${c.accent ? "text-white/80" : "text-graphite"}`}>
                          {c.label}
                        </span>
                        <span className="block font-medium">{c.value}</span>
                      </span>
                    </a>
                  </Reveal>
                );
              })}
            </div>

            <div className="mt-6 space-y-3 rounded-2xl border border-charcoal/10 bg-white/40 p-5 text-sm">
              <p className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-coral" /> {SITE.city}, {SITE.country} · delivery countrywide
              </p>
              <p className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-coral" /> Mon–Sat · 9:00–18:00 EAT
              </p>
              <div className="flex gap-3">
                <Truck className="mt-0.5 h-4 w-4 shrink-0 text-coral" />
                <span className="text-graphite">
                  <strong className="font-medium text-charcoal">Nairobi &amp; environs:</strong> we
                  deliver to your door — pay on delivery.
                  <br />
                  <strong className="font-medium text-charcoal">Outside Nairobi:</strong> delivered
                  by courier — the fee depends on your location and is confirmed before dispatch.
                </span>
              </div>
            </div>

            {/* Map */}
            <div className="mt-6 overflow-hidden rounded-2xl border border-charcoal/10">
              <iframe
                title="Alcove Atelier location"
                src="https://www.google.com/maps?q=Nairobi,Kenya&output=embed"
                className="h-64 w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          {/* Form */}
          <Reveal delay={1}>
            <div className="rounded-3xl border border-charcoal/10 bg-white/50 p-6 sm:p-8">
              <h2 className="mb-6 font-serif text-2xl">Send us a message</h2>
              <ContactForm />
            </div>
          </Reveal>
        </div>
      </div>
      <div className="h-24" />
    </div>
  );
}
