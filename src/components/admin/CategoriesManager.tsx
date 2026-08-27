"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import { useFeedback } from "@/components/ui/Feedback";

type Category = {
  id: string;
  slug: string;
  name: string;
  blurb: string;
  image: string;
};

type Form = { id?: string; name: string; blurb: string; image: string };

const emptyForm = (): Form => ({ name: "", blurb: "", image: "" });

export function CategoriesManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const { toast, confirm } = useFeedback();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Form | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/categories");
    const data = await res.json();
    setCategories(data.categories ?? []);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function remove(id: string) {
    const category = categories.find((c) => c.id === id);
    const ok = await confirm({
      title: `Delete ${category?.name ?? "this category"}?`,
      body: "Products in it keep their tag, but the category disappears from the shop filters, the home page and the footer.",
      confirmLabel: "Delete category",
      tone: "danger",
    });
    if (!ok) return;

    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Could not delete that category", "Please try again.");
      return;
    }
    setCategories((prev) => prev.filter((c) => c.id !== id));
    toast.success("Category deleted", category?.name);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-graphite">
          Add, rename or restyle the categories shown in the shop filters, home page and footer.
        </p>
        <button
          onClick={() => setEditing(emptyForm())}
          className="flex h-11 items-center gap-2 rounded-full bg-charcoal px-5 text-sm text-cream hover:bg-graphite"
        >
          <Plus className="h-4 w-4" /> Add category
        </button>
      </div>

      {loading ? (
        <div className="grid place-items-center py-24 text-graphite">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <div key={c.id} className="overflow-hidden rounded-2xl border border-charcoal/10 bg-cream">
              <div className="relative aspect-[5/3] bg-sand">
                {c.image && <SafeImage src={c.image} alt={c.name} fill sizes="33vw" fallbackSeed={c.slug} className="object-cover" />}
                <div className="absolute right-2 top-2 flex gap-1">
                  <button
                    onClick={() => setEditing({ id: c.id, name: c.name, blurb: c.blurb, image: c.image })}
                    aria-label="Edit"
                    className="grid h-8 w-8 place-items-center rounded-full bg-cream/90 text-charcoal hover:bg-white"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => remove(c.id)}
                    aria-label="Delete"
                    className="grid h-8 w-8 place-items-center rounded-full bg-cream/90 text-coral hover:bg-white"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-serif text-xl">{c.name}</h3>
                <p className="text-xs text-graphite">/{c.slug}</p>
                {c.blurb && <p className="mt-2 text-sm text-graphite">{c.blurb}</p>}
              </div>
            </div>
          ))}
          {categories.length === 0 && (
            <p className="col-span-full py-12 text-center text-sm text-graphite">
              No categories yet. Add your first one.
            </p>
          )}
        </div>
      )}

      <AnimatePresence>
        {editing && (
          <CategoryEditor
            initial={editing}
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

function CategoryEditor({
  initial,
  onClose,
  onSaved,
}: {
  initial: Form;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Form>(initial);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      // Category tiles are wide, so these render to 5:3 rather than 4:5.
      fd.append("kind", "category");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error ?? "That image couldn't be uploaded.");
        return;
      }
      setForm((f) => ({ ...f, image: data.url }));
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setSaving(true);
    setError(null);
    const res = await fetch(
      form.id ? `/api/admin/categories/${form.id}` : "/api/admin/categories",
      {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, blurb: form.blurb, image: form.image }),
      }
    );
    const data = await res.json();
    setSaving(false);
    if (data.ok) onSaved();
    else setError(data.error || "Save failed");
  }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[70] bg-charcoal/40" />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 z-[80] flex h-full w-full max-w-md flex-col bg-cream shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-charcoal/10 px-6 py-4">
          <h2 className="font-serif text-2xl">{form.id ? "Edit category" : "New category"}</h2>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-charcoal/5">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Wall Art"
              className="h-11 w-full rounded-lg border border-charcoal/15 bg-white/60 px-3 text-sm focus:border-pink-strong focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Short description</label>
            <textarea
              value={form.blurb}
              onChange={(e) => setForm((f) => ({ ...f, blurb: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-charcoal/15 bg-white/60 px-3 py-2 text-sm focus:border-pink-strong focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Image</label>
            <div className="flex items-center gap-3">
              <div className="relative h-20 w-28 overflow-hidden rounded-lg bg-sand">
                {form.image && <SafeImage src={form.image} alt="" fill sizes="112px" className="object-cover" />}
              </div>
              <label className="flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-charcoal/20 px-3 text-sm hover:border-coral">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Upload
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
              </label>
            </div>
            <p className="mt-2 text-xs text-graphite">
              Any size or shape is fine — category photos are resized to a
              standard 1500×900 (5:3 landscape).
            </p>
            <input
              value={form.image}
              onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
              placeholder="…or paste an image URL"
              className="mt-2 h-10 w-full rounded-lg border border-charcoal/15 bg-white/60 px-3 text-sm focus:border-pink-strong focus:outline-none"
            />
          </div>
          {error && <p className="text-sm text-coral">{error}</p>}
        </div>

        <div className="border-t border-charcoal/10 p-4">
          <button
            onClick={save}
            disabled={saving || !form.name}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-pink-strong font-medium text-white disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : form.id ? "Save changes" : "Create category"}
          </button>
        </div>
      </motion.div>
    </>
  );
}
