"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ImagePlus, Loader2, Pencil, Plus, Search, Trash2, Upload, X } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import { cn, formatKES, slugify } from "@/lib/utils";
import { matchesStockFilter, stockState, type StockFilter } from "@/lib/stock";

type Cat = { slug: string; name: string };

type AdminProduct = {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  compareAt: number | null;
  shortDesc: string;
  description: string;
  images: string; // JSON
  colors: string;
  sizes: string;
  materials: string | null;
  featured: boolean;
  bespoke: boolean;
  inStock: number;
  published: boolean;
};

type FormState = {
  id?: string;
  name: string;
  category: string;
  price: string;
  compareAt: string;
  shortDesc: string;
  description: string;
  images: string[];
  colors: string;
  sizes: string;
  materials: string;
  featured: boolean;
  bespoke: boolean;
  inStock: string;
  published: boolean;
};

const parse = (s: string | null): string[] => {
  if (!s) return [];
  try {
    const p = JSON.parse(s);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
};

const emptyForm = (): FormState => ({
  name: "",
  category: "",
  price: "",
  compareAt: "",
  shortDesc: "",
  description: "",
  images: [],
  colors: "",
  sizes: "",
  materials: "",
  featured: false,
  bespoke: false,
  inStock: "0",
  published: true,
});

export function ProductsManager({
  initialQuery = "",
  initialStock = "all",
}: {
  initialQuery?: string;
  initialStock?: StockFilter;
}) {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(initialQuery);
  const [stockFilter, setStockFilter] = useState<StockFilter>(initialStock);
  const [editing, setEditing] = useState<FormState | null>(null);

  async function load() {
    setLoading(true);
    const [pRes, cRes] = await Promise.all([
      fetch("/api/admin/products"),
      fetch("/api/admin/categories"),
    ]);
    const pData = await pRes.json();
    const cData = await cRes.json();
    setProducts(pData.products ?? []);
    setCategories(
      (cData.categories ?? []).map((c: { slug: string; name: string }) => ({
        slug: c.slug,
        name: c.name,
      }))
    );
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  const catName = (slug: string) =>
    categories.find((c) => c.slug === slug)?.name ?? slug;

  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) &&
          matchesStockFilter(p, stockFilter)
      ),
    [products, query, stockFilter]
  );

  // Counts for the stock chips — always over the whole catalogue, so the
  // numbers don't move around as you search.
  const stockCounts = useMemo(
    () => ({
      all: products.length,
      low: products.filter((p) => matchesStockFilter(p, "low")).length,
      out: products.filter((p) => matchesStockFilter(p, "out")).length,
    }),
    [products]
  );

  function startEdit(p: AdminProduct) {
    setEditing({
      id: p.id,
      name: p.name,
      category: p.category,
      price: String(p.price),
      compareAt: p.compareAt ? String(p.compareAt) : "",
      shortDesc: p.shortDesc,
      description: p.description,
      images: parse(p.images),
      colors: parse(p.colors).join(", "),
      sizes: parse(p.sizes).join(", "),
      materials: parse(p.materials).join(", "),
      featured: p.featured,
      bespoke: p.bespoke,
      inStock: String(p.inStock),
      published: p.published,
    });
  }

  async function remove(id: string) {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className="h-11 w-full rounded-full border border-charcoal/15 bg-cream pl-11 pr-4 text-sm focus:border-pink-strong focus:outline-none"
          />
        </div>
        <button
          onClick={() => setEditing(emptyForm())}
          className="flex h-11 items-center gap-2 rounded-full bg-charcoal px-5 text-sm text-cream hover:bg-graphite"
        >
          <Plus className="h-4 w-4" /> Add product
        </button>
      </div>

      {/* Stock filters — the dashboard & alert bell link straight in here */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {(
          [
            { key: "all", label: "All products" },
            { key: "low", label: "Needs restock" },
            { key: "out", label: "Out of stock" },
          ] as { key: StockFilter; label: string }[]
        ).map((f) => (
          <button
            key={f.key}
            onClick={() => setStockFilter(f.key)}
            className={cn(
              "flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm transition-colors",
              stockFilter === f.key
                ? "border-charcoal bg-charcoal text-cream"
                : "border-charcoal/15 text-graphite hover:border-charcoal"
            )}
          >
            {f.label}
            <span
              className={cn(
                "grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px]",
                stockFilter === f.key ? "bg-cream/20 text-cream" : "bg-charcoal/8 text-graphite"
              )}
            >
              {stockCounts[f.key]}
            </span>
          </button>
        ))}
        {(query || stockFilter !== "all") && (
          <button
            onClick={() => {
              setQuery("");
              setStockFilter("all");
            }}
            className="ml-1 flex items-center gap-1 text-sm text-graphite hover:text-coral"
          >
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid place-items-center py-24 text-graphite">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-charcoal/10 bg-cream">
          <table className="w-full text-sm">
            <thead className="bg-sand/60 text-left text-xs uppercase tracking-wider text-graphite">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const imgs = parse(p.images);
                return (
                  <tr key={p.id} className="border-t border-charcoal/5">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded-md bg-sand">
                          {imgs[0] && (
                            <SafeImage src={imgs[0]} alt="" fill sizes="40px" fallbackSeed={p.slug} className="object-cover" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{p.name}</p>
                          <p className="text-xs text-graphite">{p.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize text-graphite">{catName(p.category)}</td>
                    <td className="px-4 py-3">{formatKES(p.price)}</td>
                    <td className="px-4 py-3">
                      <StockCell product={p} />
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs",
                          p.published ? "bg-emerald-100 text-emerald-700" : "bg-charcoal/10 text-graphite"
                        )}
                      >
                        {p.published ? "Live" : "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => startEdit(p)} aria-label="Edit" className="rounded-lg p-2 hover:bg-charcoal/5">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => remove(p.id)} aria-label="Delete" className="rounded-lg p-2 text-coral hover:bg-coral/10">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="py-12 text-center text-sm text-graphite">
              {stockFilter === "out"
                ? "Nothing is out of stock."
                : stockFilter === "low"
                  ? "Everything is well stocked."
                  : "No products found."}
            </p>
          )}
        </div>
      )}

      <AnimatePresence>
        {editing && (
          <ProductEditor
            initial={editing}
            categories={categories}
            onClose={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              load();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/** Stock at a glance — what the dashboard alerts are pointing at. */
function StockCell({ product }: { product: AdminProduct }) {
  const state = stockState(product);
  if (state === "bespoke") return <span className="text-graphite">Made to order</span>;
  if (state === "out")
    return (
      <span className="rounded-full bg-coral/15 px-2 py-0.5 text-xs font-medium text-coral">
        Out of stock
      </span>
    );
  if (state === "low")
    return (
      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
        {product.inStock} left
      </span>
    );
  return <span>{product.inStock}</span>;
}

function ProductEditor({
  initial,
  categories,
  onClose,
  onSaved,
}: {
  initial: FormState;
  categories: Cat[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(initial);
  // The category field is edited by display name (so a new one can be typed);
  // it's resolved back to a slug on save.
  const [categoryName, setCategoryName] = useState<string>(
    categories.find((c) => c.slug === initial.category)?.name ?? initial.category
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imgUrl, setImgUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  /** Resolve the typed category to a slug, creating a new category if needed. */
  async function resolveCategorySlug(): Promise<string> {
    const trimmed = categoryName.trim();
    if (!trimmed) return "";
    const existing = categories.find(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) return existing.slug;
    // New category — create it on the fly.
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    const data = await res.json();
    return data?.category?.slug ?? slugify(trimmed);
  }

  async function upload(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url) set("images", [...form.images, data.url]);
    setUploading(false);
  }

  async function save() {
    setSaving(true);
    setError(null);
    const categorySlug = await resolveCategorySlug();
    if (!categorySlug) {
      setError("Please choose or type a category.");
      setSaving(false);
      return;
    }
    const payload = {
      name: form.name,
      category: categorySlug,
      price: Number(form.price || 0),
      compareAt: form.compareAt ? Number(form.compareAt) : null,
      shortDesc: form.shortDesc,
      description: form.description,
      images: form.images,
      colors: form.colors.split(",").map((s) => s.trim()).filter(Boolean),
      sizes: form.sizes.split(",").map((s) => s.trim()).filter(Boolean),
      materials: form.materials.split(",").map((s) => s.trim()).filter(Boolean),
      featured: form.featured,
      bespoke: form.bespoke,
      inStock: Number(form.inStock || 0),
      published: form.published,
    };
    const res = await fetch(
      form.id ? `/api/admin/products/${form.id}` : "/api/admin/products",
      {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const data = await res.json();
    setSaving(false);
    if (data.ok) onSaved();
    else setError(data.error || "Save failed");
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[70] bg-charcoal/40"
      />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 z-[80] flex h-full w-full max-w-xl flex-col bg-cream shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-charcoal/10 px-6 py-4">
          <h2 className="font-serif text-2xl">{form.id ? "Edit product" : "New product"}</h2>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-charcoal/5">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          {/* Images */}
          <div>
            <label className="mb-2 block text-sm font-medium">Images</label>
            <div className="flex flex-wrap gap-3">
              {form.images.map((src, i) => (
                <div key={i} className="relative h-24 w-20 overflow-hidden rounded-lg bg-sand">
                  <SafeImage src={src} alt="" fill sizes="80px" className="object-cover" />
                  <button
                    onClick={() => set("images", form.images.filter((_, idx) => idx !== i))}
                    className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-charcoal/70 text-white"
                    aria-label="Remove image"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <label className="grid h-24 w-20 cursor-pointer place-items-center rounded-lg border-2 border-dashed border-charcoal/20 text-graphite hover:border-coral hover:text-coral">
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
                />
              </label>
            </div>
            <div className="mt-2 flex gap-2">
              <input
                value={imgUrl}
                onChange={(e) => setImgUrl(e.target.value)}
                placeholder="…or paste an image URL"
                className="h-10 flex-1 rounded-lg border border-charcoal/15 bg-white/60 px-3 text-sm focus:border-pink-strong focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (imgUrl.trim()) {
                    set("images", [...form.images, imgUrl.trim()]);
                    setImgUrl("");
                  }
                }}
                className="flex h-10 items-center gap-1 rounded-lg bg-charcoal px-3 text-sm text-cream"
              >
                <ImagePlus className="h-4 w-4" /> Add
              </button>
            </div>
          </div>

          <TextField label="Name" value={form.name} onChange={(v) => set("name", v)} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Category</label>
              <input
                list="product-categories"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Select or type a new category…"
                className="h-11 w-full rounded-lg border border-charcoal/15 bg-white/60 px-3 text-sm focus:border-pink-strong focus:outline-none"
              />
              <datalist id="product-categories">
                {categories.map((c) => (
                  <option key={c.slug} value={c.name} />
                ))}
              </datalist>
              <p className="mt-1 text-xs text-graphite">
                Type a new name to create a category on the fly.
              </p>
            </div>
            <TextField label="Stock (0 = made to order)" type="number" value={form.inStock} onChange={(v) => set("inStock", v)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <TextField label="Price (KES)" type="number" value={form.price} onChange={(v) => set("price", v)} />
            <TextField label="Compare-at (optional)" type="number" value={form.compareAt} onChange={(v) => set("compareAt", v)} />
          </div>
          <TextField label="Short description" value={form.shortDesc} onChange={(v) => set("shortDesc", v)} />
          <div>
            <label className="mb-1.5 block text-sm font-medium">Full description</label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-charcoal/15 bg-white/60 px-3 py-2 text-sm focus:border-pink-strong focus:outline-none"
            />
          </div>
          <TextField label="Colours (comma separated)" value={form.colors} onChange={(v) => set("colors", v)} />
          <TextField label="Sizes / options (comma separated)" value={form.sizes} onChange={(v) => set("sizes", v)} />
          <TextField label="Materials (comma separated)" value={form.materials} onChange={(v) => set("materials", v)} />

          <div className="flex flex-wrap gap-4">
            <Toggle label="Featured" checked={form.featured} onChange={(v) => set("featured", v)} />
            <Toggle label="Made to order" checked={form.bespoke} onChange={(v) => set("bespoke", v)} />
            <Toggle label="Published" checked={form.published} onChange={(v) => set("published", v)} />
          </div>

          {error && <p className="text-sm text-coral">{error}</p>}
        </div>

        <div className="border-t border-charcoal/10 p-4">
          <button
            onClick={save}
            disabled={saving || !form.name}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-pink-strong font-medium text-white disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : form.id ? "Save changes" : "Create product"}
          </button>
        </div>
      </motion.div>
    </>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-lg border border-charcoal/15 bg-white/60 px-3 text-sm focus:border-pink-strong focus:outline-none"
      />
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 text-sm"
    >
      <span
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors",
          checked ? "bg-pink-strong" : "bg-charcoal/20"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
            checked ? "translate-x-5" : "translate-x-0.5"
          )}
        />
      </span>
      {label}
    </button>
  );
}
