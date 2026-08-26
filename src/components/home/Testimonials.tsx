"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { TESTIMONIALS } from "@/data/testimonials";

export function Testimonials() {
  const [i, setI] = useState(0);
  const t = TESTIMONIALS[i];
  const go = (dir: number) =>
    setI((prev) => (prev + dir + TESTIMONIALS.length) % TESTIMONIALS.length);

  return (
    <section className="bg-gradient-to-b from-blush-50 via-blush-100 to-blush-50 py-20 md:py-28">
      <div className="container-x">
        <SectionHeading
          eyebrow="Loved by our clients"
          title="Kind words from Kenyan homes"
          align="center"
        />

        <div className="relative mx-auto mt-12 max-w-3xl text-center">
          <Quote className="mx-auto h-10 w-10 text-pink-strong/50" />
          <AnimatePresence mode="wait">
            <motion.blockquote
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
              className="mt-6"
            >
              <p className="font-serif text-2xl leading-relaxed text-charcoal sm:text-3xl">
                “{t.text}”
              </p>
              <div className="mt-8 flex flex-col items-center gap-2">
                <div className="flex gap-1">
                  {Array.from({ length: t.rating }).map((_, s) => (
                    <Star key={s} className="h-4 w-4 fill-coral text-coral" />
                  ))}
                </div>
                <p className="font-medium text-charcoal">{t.name}</p>
                <p className="text-sm text-graphite">
                  {t.location} · {t.product}
                </p>
              </div>
            </motion.blockquote>
          </AnimatePresence>

          <div className="mt-10 flex items-center justify-center gap-3">
            <button
              onClick={() => go(-1)}
              aria-label="Previous testimonial"
              className="grid h-11 w-11 place-items-center rounded-full border border-charcoal/15 bg-cream transition-colors hover:border-charcoal hover:bg-charcoal hover:text-cream"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex gap-2">
              {TESTIMONIALS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setI(idx)}
                  aria-label={`Go to testimonial ${idx + 1}`}
                  className={`h-2 rounded-full transition-all ${
                    idx === i ? "w-6 bg-coral" : "w-2 bg-charcoal/20"
                  }`}
                />
              ))}
            </div>
            <button
              onClick={() => go(1)}
              aria-label="Next testimonial"
              className="grid h-11 w-11 place-items-center rounded-full border border-charcoal/15 bg-cream transition-colors hover:border-charcoal hover:bg-charcoal hover:text-cream"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
