"use client";

import { motion } from "framer-motion";
import { ArrowRight, Star } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { SafeImage } from "@/components/ui/SafeImage";
import { LogoMark } from "@/components/Logo";
import { waLink } from "@/lib/whatsapp";
import { SITE } from "@/lib/site";

const ease = [0.16, 1, 0.3, 1] as const;

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-[var(--header-h)]">
      {/* Ambient brand glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 right-[-8%] h-[46rem] w-[46rem] rounded-full bg-pink/50 blur-[110px]" />
        <div className="absolute top-1/4 left-[-12%] h-[34rem] w-[34rem] rounded-full bg-blush/70 blur-[120px]" />
        <div className="absolute bottom-[-18%] left-1/3 h-[30rem] w-[30rem] rounded-full bg-coral/25 blur-[120px]" />
      </div>

      <div className="container-x grid items-center gap-10 py-16 md:py-20 lg:grid-cols-2 lg:gap-8">
        {/* Copy */}
        <div className="relative">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="eyebrow"
          >
            Handmade in {SITE.country}
          </motion.p>

          <h1 className="mt-5 font-serif text-5xl leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
            {["Curated pieces", "for the spaces", "you love."].map((line, i) => (
              <motion.span
                key={line}
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 + i * 0.12, ease }}
                className="block"
              >
                {line === "you love." ? (
                  <span className="relative">
                    you{" "}
                    <span className="relative italic text-pink-strong">
                      love.
                      <motion.svg
                        viewBox="0 0 200 12"
                        className="absolute -bottom-2 left-0 w-full"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 1, delay: 1, ease }}
                      >
                        <motion.path
                          d="M2 8 C 50 2, 150 2, 198 7"
                          fill="none"
                          stroke="#ef6592"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                      </motion.svg>
                    </span>
                  </span>
                ) : (
                  line
                )}
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6, ease }}
            className="mt-6 max-w-md text-lg leading-relaxed text-graphite"
          >
            Custom mirrors, throws, cushions, rugs and bath accents — bespoke,
            hand-made and finished to order for beautiful Kenyan homes.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.72, ease }}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <ButtonLink href="/shop" variant="primary" size="lg">
              Shop the collection <ArrowRight className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink
              href={waLink(`Hi ${SITE.name}! I'd like to commission a bespoke piece.`)}
              external
              variant="outline"
              size="lg"
            >
              Enquire on WhatsApp
            </ButtonLink>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.9 }}
            className="mt-10 flex items-center gap-5 text-sm text-graphite"
          >
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-coral text-coral" />
              ))}
            </div>
            <span className="h-4 w-px bg-silver" />
            <span>
              <strong className="text-charcoal">800+</strong> pieces made to order
            </span>
          </motion.div>
        </div>

        {/* Image composition */}
        <div className="relative h-[26rem] sm:h-[32rem] lg:h-[38rem]">
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease }}
            className="absolute left-1/2 top-0 h-[80%] w-[64%] -translate-x-1/2 overflow-hidden rounded-t-[999px] shadow-2xl"
            style={{ borderTopLeftRadius: 999, borderTopRightRadius: 999 }}
          >
            <SafeImage
              src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=900&q=80"
              alt="Arched Alcove Atelier mirror"
              fill
              priority
              sizes="(max-width:1024px) 60vw, 30vw"
              fallbackSeed="hero-mirror"
              className="object-cover"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -30, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 1, delay: 0.5, ease }}
            className="absolute bottom-6 left-0 h-40 w-32 overflow-hidden rounded-2xl shadow-xl animate-float-slow sm:h-52 sm:w-40"
          >
            <SafeImage
              src="https://images.unsplash.com/photo-1584100936595-c0654b55a2e6?w=600&q=80"
              alt="Velvet cushion"
              fill
              sizes="160px"
              fallbackSeed="hero-cushion"
              className="object-cover"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 1, delay: 0.65, ease }}
            className="absolute bottom-14 right-0 h-36 w-28 overflow-hidden rounded-2xl shadow-xl sm:h-44 sm:w-36"
          >
            <SafeImage
              src="https://images.unsplash.com/photo-1580301762395-83f54a0d0a3c?w=600&q=80"
              alt="Bouclé throw"
              fill
              sizes="144px"
              fallbackSeed="hero-throw"
              className="object-cover"
            />
          </motion.div>

          <div className="pointer-events-none absolute right-6 top-6 text-coral/30">
            <LogoMark className="h-24 animate-float-slow" />
          </div>
        </div>
      </div>

      {/* Marquee value strip */}
      <div className="border-y border-charcoal/10 bg-cream/60 py-4">
        <div className="flex overflow-hidden">
          <div className="animate-marquee flex shrink-0 items-center gap-10 pr-10 font-serif text-2xl text-charcoal/70">
            {[
              "Custom Mirrors",
              "Throws & Blankets",
              "Cushion Covers",
              "Rugs & Carpets",
              "Bean Bags",
              "Bath & Accents",
            ]
              .concat([
                "Custom Mirrors",
                "Throws & Blankets",
                "Cushion Covers",
                "Rugs & Carpets",
                "Bean Bags",
                "Bath & Accents",
              ])
              .map((w, i) => (
                <span key={i} className="flex items-center gap-10">
                  {w} <span className="text-pink-strong">✦</span>
                </span>
              ))}
          </div>
        </div>
      </div>
    </section>
  );
}
