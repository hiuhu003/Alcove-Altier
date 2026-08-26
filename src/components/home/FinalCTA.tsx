import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { LogoMark } from "@/components/Logo";
import { waLink } from "@/lib/whatsapp";
import { SITE } from "@/lib/site";

export function FinalCTA() {
  return (
    <section className="container-x py-20 md:py-28">
      <Reveal>
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-pink-strong via-pink to-coral px-6 py-16 text-center text-white sm:px-12 md:py-24">
          <div className="pointer-events-none absolute -right-10 -top-10 text-white/20">
            <LogoMark className="h-48" />
          </div>
          <div className="pointer-events-none absolute -bottom-16 -left-10 text-white/15">
            <LogoMark className="h-56" />
          </div>

          <p className="relative eyebrow !text-white/80">Let&apos;s create something</p>
          <h2 className="relative mx-auto mt-4 max-w-2xl font-serif text-4xl leading-tight sm:text-5xl md:text-6xl">
            Ready to transform your space?
          </h2>
          <p className="relative mx-auto mt-5 max-w-lg text-white/85">
            Browse the collection or send us your idea — we reply fast and love a
            good brief.
          </p>
          <div className="relative mt-9 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/shop" variant="dark" size="lg">
              Shop now <ArrowRight className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink
              href={waLink(`Hi ${SITE.name}! I have an idea I'd love to discuss.`)}
              external
              size="lg"
              className="bg-white text-charcoal hover:bg-charcoal hover:text-white"
            >
              Message on WhatsApp
            </ButtonLink>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
