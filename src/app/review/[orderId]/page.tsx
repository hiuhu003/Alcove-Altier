import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyReviewToken } from "@/lib/review-invite";
import { getReviewsForOrder } from "@/lib/reviews";
import { ReviewForm, type ReviewablePiece } from "@/components/reviews/ReviewForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Leave a review",
  robots: { index: false, follow: false },
};

function firstImage(images: string | undefined): string | null {
  if (!images) return null;
  try {
    const parsed = JSON.parse(images);
    return Array.isArray(parsed) && typeof parsed[0] === "string" ? parsed[0] : null;
  } catch {
    return null;
  }
}

export default async function ReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { orderId } = await params;
  const { t } = await searchParams;

  // The signed token is what proves this person received the invitation email.
  if (!verifyReviewToken(orderId, t)) notFound();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      ref: true,
      items: {
        select: {
          productId: true,
          name: true,
          product: { select: { id: true, name: true, slug: true, images: true } },
        },
      },
    },
  });
  if (!order) notFound();

  const already = await getReviewsForOrder(order.id);

  // One card per distinct product still in the catalogue.
  const seen = new Set<string>();
  const pieces: ReviewablePiece[] = [];
  for (const item of order.items) {
    const p = item.product;
    if (!p || seen.has(p.id)) continue;
    seen.add(p.id);
    pieces.push({
      productId: p.id,
      name: p.name,
      slug: p.slug,
      image: firstImage(p.images),
      existingRating: already[p.id],
    });
  }

  if (pieces.length === 0) notFound();

  return (
    <ReviewForm orderId={order.id} token={t ?? ""} orderRef={order.ref} pieces={pieces} />
  );
}
