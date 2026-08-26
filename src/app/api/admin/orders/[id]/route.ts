import { NextResponse } from "next/server";
import { z } from "zod";
import { guardAdminApi } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { adjustStock } from "@/lib/orders";
import { reviewStockFor } from "@/lib/notifications";

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
