import { StarRating } from "@/components/reviews/StarRating";
import type { PublicReview } from "@/lib/reviews";

/** Customer reviews on a product page. Hidden entirely when there are none. */
export function ReviewList({
  reviews,
  rating,
}: {
  reviews: PublicReview[];
  rating: number;
}) {
  if (reviews.length === 0) return null;

  return (
    <section className="container-x border-t border-charcoal/10 pb-20 pt-14">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl sm:text-4xl">What buyers say</h2>
          <p className="mt-2 flex items-center gap-2 text-graphite">
            <StarRating value={rating} />
            <span className="text-sm">
              {rating.toFixed(1)} from {reviews.length}{" "}
              {reviews.length === 1 ? "review" : "reviews"}
            </span>
          </p>
        </div>
      </div>

      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {reviews.map((r) => (
          <li key={r.id} className="rounded-2xl border border-charcoal/10 bg-white/50 p-5">
            <StarRating value={r.rating} size="sm" />
            {r.body && (
              <p className="mt-3 text-sm leading-relaxed text-charcoal">{r.body}</p>
            )}
            <p className="mt-4 text-xs text-graphite">
              {r.authorName} ·{" "}
              {new Date(r.createdAt).toLocaleDateString("en-KE", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
