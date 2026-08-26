import "server-only";
import { prisma } from "./prisma";

/**
 * Product reviews.
 *
 * A product carries `rating` and `reviews` columns that the storefront and the
 * Product JSON-LD read directly. Rather than aggregating on every page render,
 * those two are recomputed whenever a review lands — reviews are rare, page
 * views are not.
 */

export type PublicReview = {
  id: string;
  authorName: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
};

/** Roll the published reviews for a product back into its summary columns. */
export async function refreshProductRating(productId: string): Promise<void> {
  try {
    const agg = await prisma.review.aggregate({
      where: { productId, published: true },
      _avg: { rating: true },
      _count: { _all: true },
    });

    const count = agg._count._all;
    await prisma.product.update({
      where: { id: productId },
      data: {
        // With no reviews left, fall back to 5 rather than 0 — a zero would
        // render as a one-star product that nobody has actually rated.
        rating: count > 0 ? Math.round((agg._avg.rating ?? 5) * 10) / 10 : 5,
        reviews: count,
      },
    });
  } catch (err) {
    console.error("[reviews] rating refresh failed:", err);
  }
}

export async function getProductReviews(
  productId: string,
  limit = 12
): Promise<PublicReview[]> {
  try {
    const rows = await prisma.review.findMany({
      where: { productId, published: true },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        authorName: true,
        rating: true,
        title: true,
        body: true,
        createdAt: true,
      },
    });
    return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
  } catch {
    // A review panel is never worth failing a product page over.
    return [];
  }
}

/** Reviews already left for an order, so the form can show what's done. */
export async function getReviewsForOrder(orderId: string): Promise<Record<string, number>> {
  const rows = await prisma.review.findMany({
    where: { orderId },
    select: { productId: true, rating: true },
  });
  return Object.fromEntries(rows.map((r) => [r.productId, r.rating]));
}
