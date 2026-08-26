import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/shop/ProductCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { Product } from "@/lib/types";

export function FeaturedProducts({ products }: { products: Product[] }) {
  return (
    <section className="container-x py-20 md:py-28">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeading
          eyebrow="Handpicked"
          title="Our favourite pieces"
          subtitle="A rotating edit of best-loved designs — many made to order in your choice of finish."
        />
        <Link
          href="/shop"
          className="nav-link hidden items-center gap-2 text-sm font-medium text-charcoal sm:inline-flex"
        >
          View all <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
        {products.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
      </div>

      <div className="mt-12 text-center sm:hidden">
        <Link href="/shop" className="nav-link inline-flex items-center gap-2 text-sm font-medium">
          View all products <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
