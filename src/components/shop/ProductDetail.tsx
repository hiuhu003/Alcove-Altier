"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, ChevronRight, Minus, Plus, Star, Truck } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import { Button, ButtonLink } from "@/components/ui/Button";
import { colorSwatch } from "@/lib/colors";
import { DELIVERY_POLICY } from "@/lib/delivery";
import { cn, formatKES } from "@/lib/utils";
import { useCart } from "@/store/cart";
import { productEnquiry } from "@/lib/whatsapp";
import type { Product } from "@/lib/types";

export function ProductDetail({ product }: { product: Product }) {
  const add = useCart((s) => s.add);
  const [activeImg, setActiveImg] = useState(0);
  const [color, setColor] = useState(product.colors[0]);
  const [size, setSize] = useState(product.sizes[0]);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const readyToShip = product.inStock > 0 && !product.bespoke;

  function handleAdd() {
    add(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        image: product.images[0],
        color,
        size,
        bespoke: product.bespoke,
      },
      qty
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
    <div className="container-x pb-24 pt-[calc(var(--header-h)+1.5rem)]">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-1.5 text-sm text-graphite">
        <Link href="/" className="hover:text-charcoal">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/shop" className="hover:text-charcoal">Shop</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-charcoal">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Gallery */}
        <div className="flex flex-col-reverse gap-4 sm:flex-row">
          {product.images.length > 1 && (
            <div className="flex gap-3 sm:flex-col">
              {product.images.map((src, i) => (
                <button
                  key={src}
                  onClick={() => setActiveImg(i)}
                  className={cn(
                    "relative h-20 w-16 shrink-0 overflow-hidden rounded-lg ring-1 transition-all sm:h-24 sm:w-20",
                    activeImg === i ? "ring-2 ring-pink-strong" : "ring-charcoal/10 hover:ring-charcoal/30"
                  )}
                >
                  <SafeImage src={src} alt="" fill sizes="80px" fallbackSeed={`${product.slug}-${i}`} className="object-cover" />
                </button>
              ))}
            </div>
          )}
          <motion.div
            key={activeImg}
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 1 }}
            className="relative aspect-[4/5] flex-1 overflow-hidden rounded-3xl bg-sand"
          >
            <SafeImage
              src={product.images[activeImg]}
              alt={product.name}
              fill
              priority
              sizes="(max-width:1024px) 100vw, 45vw"
              fallbackSeed={product.slug}
              className="object-cover"
            />
          </motion.div>
        </div>

        {/* Info */}
        <div className="lg:pt-4">
          <div className="flex items-center gap-3">
            {product.bespoke ? (
              <span className="rounded-full bg-charcoal px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-cream">
                Made to order
              </span>
            ) : readyToShip ? (
              <span className="rounded-full bg-pink-strong/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-pink-strong">
                In stock
              </span>
            ) : null}
            <div className="flex items-center gap-1 text-sm text-graphite">
              <Star className="h-4 w-4 fill-coral text-pink-strong" />
              {product.rating} · {product.reviews} reviews
            </div>
          </div>

          <h1 className="mt-4 font-serif text-4xl leading-tight sm:text-5xl">{product.name}</h1>
          <p className="mt-3 text-graphite">{product.shortDesc}</p>

          <div className="mt-5 flex items-end gap-3">
            <span className="font-serif text-3xl">{formatKES(product.price)}</span>
            {product.compareAt && (
              <span className="mb-1 text-graphite line-through">{formatKES(product.compareAt)}</span>
            )}
          </div>

          {/* Colour */}
          {product.colors.length > 0 && (
            <div className="mt-8">
              <p className="mb-3 text-sm font-medium">
                Colour: <span className="text-graphite">{color}</span>
              </p>
              <div className="flex flex-wrap gap-3">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    title={c}
                    className={cn(
                      "h-9 w-9 rounded-full ring-1 ring-charcoal/15 transition-all",
                      color === c && "ring-2 ring-pink-strong ring-offset-2 ring-offset-cream"
                    )}
                    style={{ background: colorSwatch(c) }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Size */}
          {product.sizes.length > 0 && (
            <div className="mt-6">
              <p className="mb-3 text-sm font-medium">Size / Option</p>
              <div className="flex flex-wrap gap-2.5">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm transition-colors",
                      size === s
                        ? "border-charcoal bg-charcoal text-cream"
                        : "border-charcoal/20 text-charcoal hover:border-charcoal"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Qty + actions */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <div className="flex h-12 items-center gap-4 rounded-full border border-charcoal/20 px-4">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-5 text-center">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} aria-label="Increase quantity">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <Button onClick={handleAdd} variant="primary" size="lg" className="flex-1 min-w-[180px]">
              {added ? (
                <>
                  <Check className="h-4 w-4" /> Added to selection
                </>
              ) : (
                <>Add to selection · {formatKES(product.price * qty)}</>
              )}
            </Button>
          </div>

          <div className="mt-3">
            <ButtonLink
              href={productEnquiry(product.name, { color, size })}
              external
              variant="whatsapp"
              size="lg"
              className="w-full"
            >
              {product.bespoke ? "Enquire / customise on WhatsApp" : "Ask a question on WhatsApp"}
            </ButtonLink>
          </div>

          {/* Delivery & payment terms */}
          <div className="mt-6 rounded-xl bg-sand px-4 py-3 text-sm text-graphite">
            <p className="flex items-center gap-2 font-medium text-charcoal">
              <Truck className="h-4 w-4 text-pink-strong" />
              {DELIVERY_POLICY.headline}
            </p>
            <ul className="mt-2 space-y-1.5">
              <li className="flex gap-2">
                <span className="text-pink-strong">·</span>
                <span>
                  <strong className="font-medium text-charcoal">Nairobi &amp; environs:</strong>{" "}
                  we deliver to your door — <strong className="font-medium text-charcoal">pay on delivery</strong>.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-pink-strong">·</span>
                <span>
                  <strong className="font-medium text-charcoal">Outside Nairobi:</strong> sent by
                  courier — the delivery fee depends on your location and is confirmed before dispatch.
                </span>
              </li>
              {product.bespoke && (
                <li className="flex gap-2">
                  <span className="text-pink-strong">·</span>
                  <span>Made to order — we confirm lead time on WhatsApp.</span>
                </li>
              )}
            </ul>
          </div>

          {/* Details */}
          <div className="mt-8 space-y-5 border-t border-charcoal/10 pt-8">
            <div>
              <h3 className="font-serif text-xl">Description</h3>
              <p className="mt-2 leading-relaxed text-graphite">{product.description}</p>
            </div>
            {product.materials && product.materials.length > 0 && (
              <div>
                <h3 className="font-serif text-xl">Materials</h3>
                <p className="mt-2 text-graphite">{product.materials.join(" · ")}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
