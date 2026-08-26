import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getCategories } from "@/lib/products";

export async function CategoryShowcase() {
  const categories = await getCategories();
  return (
    <section className="container-x py-20 md:py-28">
      <SectionHeading
        eyebrow="Shop by category"
        title="Everything to dress a room"
        subtitle="From statement mirrors to the softest throws — browse the pieces we love to make."
      />

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat, i) => (
          <Reveal key={cat.slug} delay={i}>
            <Link
              href={`/shop?category=${cat.slug}`}
              className="group relative block aspect-[5/4] overflow-hidden rounded-2xl"
            >
              <SafeImage
                src={cat.image}
                alt={cat.name}
                fill
                sizes="(max-width:640px) 100vw, 33vw"
                fallbackSeed={cat.slug}
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/75 via-charcoal/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5 text-cream">
                <div>
                  <h3 className="font-serif text-2xl">{cat.name}</h3>
                  <p className="mt-1 max-w-[16rem] text-sm text-cream/70">{cat.blurb}</p>
                </div>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-cream/15 backdrop-blur transition-colors group-hover:bg-pink-strong">
                  <ArrowUpRight className="h-5 w-5" />
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
