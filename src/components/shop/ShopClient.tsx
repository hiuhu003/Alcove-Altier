"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { ProductCard } from "@/components/shop/ProductCard";
import { colorSwatch } from "@/lib/colors";
import { cn, formatKES } from "@/lib/utils";
import type { Category, Product } from "@/lib/types";

type SortKey = "featured" | "price-asc" | "price-desc" | "newest";

export function ShopClient({
  products,
  categories,
  initialCategory,
}: {
  products: Product[];
  categories: Category[];
  initialCategory?: string;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>(initialCategory ?? "all");
  const [colors, setColors] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [availability, setAvailability] = useState<"all" | "stock" | "bespoke">("all");
  const [maxPrice, setMaxPrice] = useState<number>(0); // 0 = no limit
  const [sort, setSort] = useState<SortKey>("featured");
  const [mobileOpen, setMobileOpen] = useState(false);

  const priceCeiling = useMemo(
    () => Math.max(...products.map((p) => p.price), 20000),
    [products]
  );
  const allColors = useMemo(
    () => Array.from(new Set(products.flatMap((p) => p.colors))).sort(),
    [products]
  );
  const allSizes = useMemo(
    () => Array.from(new Set(products.flatMap((p) => p.sizes))),
    [products]
  );

  const toggle = (arr: string[], v: string) =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (query) {
        const q = query.toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !p.shortDesc.toLowerCase().includes(q))
          return false;
      }
      if (colors.length && !p.colors.some((c) => colors.includes(c))) return false;
      if (sizes.length && !p.sizes.some((s) => sizes.includes(s))) return false;
      if (availability === "stock" && p.inStock <= 0) return false;
      if (availability === "bespoke" && !p.bespoke) return false;
      if (maxPrice && p.price > maxPrice) return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      switch (sort) {
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "newest":
          return +new Date(b.createdAt) - +new Date(a.createdAt);
        default:
          return Number(b.featured) - Number(a.featured);
      }
    });
    return list;
  }, [products, category, query, colors, sizes, availability, maxPrice, sort]);

  const activeCount =
    (category !== "all" ? 1 : 0) +
    colors.length +
    sizes.length +
    (availability !== "all" ? 1 : 0) +
    (maxPrice ? 1 : 0);

  const clearAll = () => {
    setCategory("all");
    setColors([]);
    setSizes([]);
    setAvailability("all");
    setMaxPrice(0);
    setQuery("");
  };

  const FilterPanel = (
    <div className="space-y-8">
      <FilterBlock title="Category">
        <div className="flex flex-col gap-1.5">
          <Chip active={category === "all"} onClick={() => setCategory("all")}>
            All products
          </Chip>
          {categories.map((c) => (
            <Chip key={c.slug} active={category === c.slug} onClick={() => setCategory(c.slug)}>
              {c.name}
            </Chip>
          ))}
        </div>
      </FilterBlock>

      <FilterBlock title="Availability">
        <div className="flex flex-wrap gap-2">
          {([
            ["all", "All"],
            ["stock", "Ready to ship"],
            ["bespoke", "Made to order"],
          ] as const).map(([v, label]) => (
            <PillButton key={v} active={availability === v} onClick={() => setAvailability(v)}>
              {label}
            </PillButton>
          ))}
        </div>
      </FilterBlock>

      <FilterBlock title="Colour">
        <div className="flex flex-wrap gap-2.5">
          {allColors.map((c) => (
            <button
              key={c}
              onClick={() => setColors((prev) => toggle(prev, c))}
              title={c}
              aria-pressed={colors.includes(c)}
              className={cn(
                "h-7 w-7 rounded-full ring-1 ring-charcoal/15 transition-all",
                colors.includes(c) && "ring-2 ring-pink-strong ring-offset-2 ring-offset-cream"
              )}
              style={{ background: colorSwatch(c) }}
            />
          ))}
        </div>
      </FilterBlock>

      <FilterBlock title="Size">
        <div className="flex flex-wrap gap-2">
          {allSizes.map((s) => (
            <PillButton key={s} active={sizes.includes(s)} onClick={() => setSizes((prev) => toggle(prev, s))}>
              {s}
            </PillButton>
          ))}
        </div>
      </FilterBlock>

      <FilterBlock title={`Max price${maxPrice ? `: ${formatKES(maxPrice)}` : ""}`}>
        <input
          type="range"
          min={2000}
          max={priceCeiling}
          step={500}
          value={maxPrice || priceCeiling}
          onChange={(e) => setMaxPrice(Number(e.target.value) >= priceCeiling ? 0 : Number(e.target.value))}
          className="w-full accent-pink-strong"
        />
        <div className="mt-1 flex justify-between text-xs text-graphite">
          <span>{formatKES(2000)}</span>
          <span>{formatKES(priceCeiling)}+</span>
        </div>
      </FilterBlock>

      {activeCount > 0 && (
        <button onClick={clearAll} className="text-sm text-pink-strong underline underline-offset-4">
          Clear all filters ({activeCount})
        </button>
      )}
    </div>
  );

  return (
    <div className="container-x pb-24 pt-[calc(var(--header-h)+2rem)]">
      {/* Page head */}
      <div className="mb-10">
        <p className="eyebrow mb-3">The Collection</p>
        <h1 className="font-serif text-4xl sm:text-5xl">Shop Alcove Atelier</h1>
        <p className="mt-3 max-w-xl text-graphite">
          {products.length} handmade pieces — filter by category, colour, size or price,
          or search for something specific.
        </p>
      </div>

      {/* Search + sort bar */}
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className="h-12 w-full rounded-full border border-charcoal/15 bg-white/60 pl-11 pr-4 text-sm focus:border-pink-strong focus:outline-none"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="h-12 rounded-full border border-charcoal/15 bg-white/60 px-5 text-sm focus:border-pink-strong focus:outline-none"
        >
          <option value="featured">Sort: Featured</option>
          <option value="newest">Newest</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>
        <button
          onClick={() => setMobileOpen(true)}
          className="flex h-12 items-center gap-2 rounded-full border border-charcoal/15 px-5 text-sm lg:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" /> Filters
          {activeCount > 0 && (
            <span className="grid h-5 w-5 place-items-center rounded-full bg-coral text-[11px] text-white">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      <div className="flex gap-10">
        {/* Desktop sidebar */}
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-[calc(var(--header-h)+1.5rem)]">{FilterPanel}</div>
        </aside>

        {/* Grid */}
        <div className="flex-1">
          {filtered.length === 0 ? (
            <div className="grid place-items-center rounded-2xl border border-dashed border-charcoal/15 py-24 text-center">
              <p className="font-serif text-2xl">No pieces match those filters.</p>
              <button onClick={clearAll} className="mt-3 text-pink-strong underline underline-offset-4">
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <p className="mb-6 text-sm text-graphite">
                Showing {filtered.length} {filtered.length === 1 ? "piece" : "pieces"}
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3">
                {filtered.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-[70] bg-charcoal/40 lg:hidden"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-[80] max-h-[85vh] overflow-y-auto rounded-t-3xl bg-cream p-6 lg:hidden"
            >
              <div className="mb-6 flex items-center justify-between">
                <h3 className="font-serif text-2xl">Filters</h3>
                <button onClick={() => setMobileOpen(false)} aria-label="Close filters" className="rounded-full p-2 hover:bg-charcoal/5">
                  <X className="h-5 w-5" />
                </button>
              </div>
              {FilterPanel}
              <button
                onClick={() => setMobileOpen(false)}
                className="mt-8 h-12 w-full rounded-full bg-charcoal text-cream"
              >
                Show {filtered.length} results
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-3 font-sans text-xs font-semibold uppercase tracking-[0.2em] text-charcoal">
        {title}
      </h4>
      {children}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
        active ? "bg-charcoal text-cream" : "text-graphite hover:bg-charcoal/5"
      )}
    >
      {children}
    </button>
  );
}

function PillButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs transition-colors",
        active
          ? "border-pink-strong bg-pink-strong text-white"
          : "border-charcoal/15 text-graphite hover:border-charcoal"
      )}
    >
      {children}
    </button>
  );
}
