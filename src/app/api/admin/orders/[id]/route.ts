import { NextResponse } from "next/server";
import { z } from "zod";
import { guardAdminApi } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { adjustStock } from "@/lib/orders";
import { reviewStockFor } from "@/lib/notifications";
import { sendOrderStatusEmail, sendReviewRequestEmail } from "@/lib/email";
import { reviewUrlFor } from "@/lib/review-invite";

const patch = z.object({
  status: z.enum(["new", "confirmed", "fulfilled", "cancelled"]).optional(),
  paymentStatus: z.enum(["pending", "paid", "failed"]).optional(),
  deliveryZone: z.enum(["nairobi", "outside"]).optional(),
  deliveryArea: z.string().nullable().optional(),
  deliveryFee: z.coerce.number().int().nonnegative().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await guardAdminApi();
  if (denied) return denied;
  const { id } = await params;
  try {
    const d = patch.parse(await req.json());
    const before = await prisma.order.findUnique({ where: { id }, include: { items: true } });
    if (!before) return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });

    const order = await prisma.order.update({ where: { id }, data: d });

    // Cancelling an order puts its pieces back on the shelf; reopening a
    // cancelled one takes them out again. Alerts follow the new levels.
    if (d.status && d.status !== before.status) {
      const wasCancelled = before.status === "cancelled";
      const isCancelled = d.status === "cancelled";
      if (wasCancelled !== isCancelled) {
        const touched = await adjustStock(before.items, isCancelled ? 1 : -1);
        for (const pid of touched) await reviewStockFor(pid);
      }
    }

    // Keep the customer informed. Both are best-effort: the status change is
    // already saved, so a mail problem must not report the update as failed.
    if (d.status && d.status !== before.status) {
      try {
        await sendOrderStatusEmail({
          ref: order.ref,
          customerName: order.customerName,
          email: order.email,
          status: order.status,
          total: order.total,
          deliveryFee: order.deliveryFee,
          payOnDelivery: order.payOnDelivery,
        });
      } catch (err) {
        console.error("[orders] status email failed:", err);
      }

      // Once delivered, invite a review - once per order, never on a repeat
      // save or a status that bounces back and forth.
      if (order.status === "fulfilled" && !before.reviewEmailAt) {
        try {
          const url = reviewUrlFor(order.id);
          if (url) {
            await sendReviewRequestEmail({
              ref: order.ref,
              customerName: order.customerName,
              email: order.email,
              reviewUrl: url,
              items: before.items.map((i) => ({ name: i.name })),
            });
            await prisma.order.update({
              where: { id: order.id },
              data: { reviewEmailAt: new Date() },
            });
          }
        } catch (err) {
          console.error("[orders] review request failed:", err);
        }
      }
    }

    return NextResponse.json({ ok: true, order });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await guardAdminApi();
  if (denied) return denied;
  const { id } = await params;
  // Deleting a live order puts its pieces back on the shelf (a cancelled one
  // has already been restocked).
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  await prisma.order.delete({ where: { id } }).catch(() => null);
  if (order && order.status !== "cancelled") {
    const touched = await adjustStock(order.items, 1);
    for (const pid of touched) await reviewStockFor(pid);
  }
  return NextResponse.json({ ok: true });
}
