"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import { colorSwatch } from "@/lib/colors";
import { formatKES } from "@/lib/utils";
import { useCart } from "@/store/cart";
import type { Product } from "@/lib/types";

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const add = useCart((s) => s.add);
  const hasSecond = product.images.length > 1;

  const quickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.images[0],
      color: product.colors[0],
      size: product.sizes[0],
      bespoke: product.bespoke,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, delay: (index % 4) * 0.06, ease: [0.16, 1, 0.3, 1] }}
      className="group"
    >
      <Link href={`/shop/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-sand">
          <SafeImage
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(max-width:768px) 50vw, 25vw"
            fallbackSeed={product.slug}
            className="object-cover transition-all duration-700 ease-out group-hover:scale-105"
          />
          {hasSecond && (
            <SafeImage
              src={product.images[1]}
              alt=""
              fill
              sizes="(max-width:768px) 50vw, 25vw"
              fallbackSeed={`${product.slug}-2`}
              className="object-cover opacity-0 transition-opacity duration-700 ease-out group-hover:opacity-100"
            />
          )}

          {/* Badges */}
          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            {product.bespoke && (
              <span className="rounded-full bg-charcoal/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-cream backdrop-blur">
                Made to order
              </span>
            )}
            {product.compareAt && (
              <span className="rounded-full bg-pink-strong px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
                Sale
              </span>
            )}
          </div>

          {/* Quick add */}
          <button
            onClick={quickAdd}
            aria-label={`Add ${product.name} to selection`}
            className="absolute bottom-3 right-3 grid h-11 w-11 translate-y-3 place-items-center rounded-full bg-cream text-charcoal opacity-0 shadow-lg transition-all duration-500 ease-out hover:bg-pink-strong hover:text-white group-hover:translate-y-0 group-hover:opacity-100"
          >
            <Plus className="h-5 w-5" strokeWidth={1.8} />
          </button>
        </div>
      </Link>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/shop/${product.slug}`}>
            <h3 className="truncate font-serif text-lg leading-tight hover:text-pink-strong">
              {product.name}
            </h3>
          </Link>
          <div className="mt-1.5 flex items-center gap-1.5">
            {product.colors.slice(0, 5).map((c) => (
              <span
                key={c}
                title={c}
                className="h-3 w-3 rounded-full ring-1 ring-charcoal/10"
                style={{ background: colorSwatch(c) }}
              />
            ))}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-medium">{formatKES(product.price)}</p>
          {product.compareAt && (
            <p className="text-xs text-graphite line-through">
              {formatKES(product.compareAt)}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
