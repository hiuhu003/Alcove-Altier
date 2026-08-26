import { MessageCircle, Palette, Ruler, Truck } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import { Reveal } from "@/components/motion/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { waLink } from "@/lib/whatsapp";
import { SITE } from "@/lib/site";

const steps = [
  { icon: MessageCircle, title: "Tell us your idea", desc: "Message us on WhatsApp with your space, style and inspiration." },
  { icon: Ruler, title: "We measure & quote", desc: "We confirm dimensions, materials and a transparent price." },
  { icon: Palette, title: "Handmade to order", desc: "Your piece is crafted and finished by hand in our atelier." },
  { icon: Truck, title: "Delivered to you", desc: "Careful delivery across Kenya, kept updated the whole way." },
];

export function BespokeBand() {
  return (
    <section className="relative overflow-hidden bg-charcoal text-cream">
      <div className="container-x grid items-center gap-12 py-20 md:py-28 lg:grid-cols-2">
        <div>
          <Reveal>
            <p className="eyebrow mb-3">Made to order</p>
          </Reveal>
          <Reveal delay={1}>
            <h2 className="font-serif text-4xl leading-tight sm:text-5xl">
              Bespoke pieces, made just for your space
            </h2>
          </Reveal>
          <Reveal delay={2}>
            <p className="mt-4 max-w-md text-cream/70">
              Most of what we make is one-of-a-kind. Share your vision and we&apos;ll
              craft it to your exact size, colour and finish — no showroom required.
            </p>
          </Reveal>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {steps.map((s, i) => (
              <Reveal key={s.title} delay={i}>
                <div className="flex gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-pink-strong/15 text-pink-strong">
                    <s.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-serif text-xl">{s.title}</h3>
                    <p className="mt-1 text-sm text-cream/60">{s.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={2}>
            <div className="mt-10">
              <ButtonLink
                href={waLink(`Hi ${SITE.name}! I'd like to start a bespoke commission.`)}
                external
                variant="whatsapp"
                size="lg"
              >
                Start your commission
              </ButtonLink>
            </div>
          </Reveal>
        </div>

        <Reveal delay={1}>
          <div className="relative mx-auto h-[26rem] w-full max-w-md overflow-hidden rounded-t-[999px]">
            <SafeImage
              src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=900&q=80"
              alt="A bespoke interior styled by Alcove Atelier"
              fill
              sizes="(max-width:1024px) 90vw, 40vw"
              fallbackSeed="bespoke-band"
              className="object-cover"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
