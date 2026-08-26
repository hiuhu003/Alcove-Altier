"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import { StarPicker, StarRating } from "@/components/reviews/StarRating";
import { useFeedback } from "@/components/ui/Feedback";

export type ReviewablePiece = {
  productId: string;
  name: string;
  slug: string;
  image: string | null;
  /** Already reviewed from this order? Then we show the rating, not the form. */
  existingRating?: number;
};

/**
 * The form the "how did we do?" email links to.
 *
 * One card per piece in the order, each submitted on its own — someone who only
 * wants to rate one thing shouldn't have to fill in the rest.
 */
export function ReviewForm({
  orderId,
  token,
  orderRef,
  pieces,
}: {
  orderId: string;
  token: string;
  orderRef: string;
  pieces: ReviewablePiece[];
}) {
  const [done, setDone] = useState<Record<string, number>>(
    Object.fromEntries(
      pieces.filter((p) => p.existingRating).map((p) => [p.productId, p.existingRating!])
    )
  );

  const remaining = pieces.filter((p) => !done[p.productId]);

  return (
    <div className="container-x pb-24 pt-[calc(var(--header-h)+2rem)]">
      <div className="mx-auto max-w-2xl">
        <p className="text-sm uppercase tracking-[0.2em] text-graphite">Order {orderRef}</p>
        <h1 className="mt-2 font-serif text-4xl sm:text-5xl">How did we do?</h1>
        <p className="mt-3 leading-relaxed text-graphite">
          Your rating helps other people shopping for the same piece. It takes a few
          seconds and you can rate just one thing if you like.
        </p>

        <div className="mt-9 space-y-5">
          {pieces.map((piece) => (
            <PieceCard
              key={piece.productId}
              piece={piece}
              orderId={orderId}
              token={token}
              savedRating={done[piece.productId]}
              onSaved={(rating) =>
                setDone((d) => ({ ...d, [piece.productId]: rating }))
              }
            />
          ))}
        </div>

        {remaining.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 rounded-2xl bg-blush/30 px-6 py-5 text-center"
          >
            <p className="font-serif text-2xl">Thank you</p>
            <p className="mt-1 text-sm text-graphite">
              Your review is live on the product page.
            </p>
            <Link
              href="/shop"
              className="mt-4 inline-block text-sm font-medium text-pink-strong underline underline-offset-4"
            >
              Back to the shop
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function PieceCard({
  piece,
  orderId,
  token,
  savedRating,
  onSaved,
}: {
  piece: ReviewablePiece;
  orderId: string;
  token: string;
  savedRating?: number;
  onSaved: (rating: number) => void;
}) {
  const { toast } = useFeedback();
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) {
      setError("Please choose a star rating first.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, token, productId: piece.productId, rating, body }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "That didn't save. Please try again.");
        setSaving(false);
        return;
      }
      onSaved(rating);
      toast.success("Thank you for the review", piece.name);
    } catch {
      setError("We couldn't reach the server. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="rounded-3xl border border-charcoal/10 bg-white/60 p-5 sm:p-6">
      <div className="flex gap-4">
        {piece.image && (
          <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-sand">
            <SafeImage
              src={piece.image}
              alt={piece.name}
              fill
              sizes="64px"
              fallbackSeed={piece.slug}
              className="object-cover"
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <Link
            href={`/shop/${piece.slug}`}
            className="font-serif text-xl leading-tight hover:text-pink-strong"
          >
            {piece.name}
          </Link>

          {savedRating ? (
            <p className="mt-2 flex items-center gap-2 text-sm text-graphite">
              <Check className="h-4 w-4 text-emerald-600" />
              <StarRating value={savedRating} size="sm" /> Reviewed
            </p>
          ) : (
            <form onSubmit={submit} className="mt-3">
              <StarPicker
                name={`rating-${piece.productId}`}
                value={rating}
                onChange={setRating}
                disabled={saving}
              />
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="Anything you'd like to add? (optional)"
                className="mt-3 w-full rounded-xl border border-charcoal/15 bg-white/70 px-4 py-3 text-sm focus:border-pink-strong focus:outline-none"
              />
              {error && (
                <p role="alert" className="mt-2 text-sm text-coral">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={saving}
                className="mt-3 flex h-11 items-center justify-center gap-2 rounded-full bg-pink-strong px-6 text-sm font-medium text-white transition-colors hover:bg-charcoal disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                  </>
                ) : (
                  "Submit review"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
