import type { Metadata } from "next";
import { Hand, Leaf, Ruler, Sparkles } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ButtonLink } from "@/components/ui/Button";
import { FinalCTA } from "@/components/home/FinalCTA";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "About — Our Story",
  description:
    "Alcove Atelier hand-makes custom mirrors and bespoke home décor in Kenya. Meet the atelier behind the pieces.",
  alternates: { canonical: "/about" },
};

const values = [
  { icon: Hand, title: "Handmade", desc: "Every piece is crafted and finished by hand in our atelier." },
  { icon: Ruler, title: "Made to measure", desc: "Bespoke sizing, colours and finishes to suit your space." },
  { icon: Leaf, title: "Considered materials", desc: "Quality fabrics and finishes chosen to last and feel good." },
  { icon: Sparkles, title: "Curated by eye", desc: "A designer's eye on every detail, from stitch to surround." },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden pt-[calc(var(--header-h)+3rem)]">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-20 right-0 h-96 w-96 rounded-full bg-blush/30 blur-[110px]" />
        </div>
        <div className="container-x grid items-center gap-12 pb-8 lg:grid-cols-2">
          <div>
            <p className="eyebrow mb-4">Our story</p>
            <h1 className="font-serif text-5xl leading-tight sm:text-6xl">
              Beautiful things, <span className="italic text-pink-strong">made by hand</span>
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-graphite">
              Alcove Atelier began with a love for the details that make a house feel
              like home — a mirror that catches the light, a throw you reach for
              every evening. Today we design and hand-make custom mirrors and
              bespoke décor for homes across {SITE.country}.
            </p>
            <div className="mt-8">
              <ButtonLink href="/shop" variant="primary" size="lg">
                Explore the collection
              </ButtonLink>
            </div>
          </div>
          <Reveal delay={1}>
            <div className="relative mx-auto h-[26rem] w-full max-w-md overflow-hidden rounded-t-[999px] shadow-2xl">
              <SafeImage
                src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=900&q=80"
                alt="An interior styled with Alcove Atelier pieces"
                fill
                sizes="(max-width:1024px) 90vw, 40vw"
                fallbackSeed="about-hero"
                className="object-cover"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Values */}
      <section className="container-x py-20 md:py-28">
        <SectionHeading eyebrow="What we believe" title="Craft you can feel" align="center" />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v, i) => (
            <Reveal key={v.title} delay={i}>
              <div className="h-full rounded-2xl border border-charcoal/10 bg-white/40 p-6">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-pink-strong/10 text-pink-strong">
                  <v.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 font-serif text-2xl">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-graphite">{v.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Stats band */}
      <section className="bg-charcoal py-16 text-cream">
        <div className="container-x grid gap-8 text-center sm:grid-cols-3">
          {[
            ["800+", "Pieces made to order"],
            ["100%", "Handmade in Kenya"],
            ["5.0", "Average client rating"],
          ].map(([n, l]) => (
            <Reveal key={l}>
              <div>
                <p className="font-serif text-5xl text-pink-strong">{n}</p>
                <p className="mt-2 text-sm text-cream/70">{l}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <FinalCTA />
    </>
  );
}
