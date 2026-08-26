import "server-only";
import { z } from "zod";
import { prisma } from "./prisma";
import { sendOrderEmails } from "./email";
import { notifyNewOrder, notifyOrderPaid, reviewStockFor } from "./notifications";
import { getZone } from "./delivery";

export const orderItemSchema = z.object({
  productId: z.string().optional(),
  name: z.string(),
  color: z.string().optional().nullable(),
  size: z.string().optional().nullable(),
  price: z.number().int().nonnegative(),
  qty: z.number().int().positive(),
});

export const createOrderSchema = z.object({
  customerName: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(7, "Phone is required"),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  channel: z.enum(["whatsapp", "mpesa", "stripe", "paypal", "cod"]),
  deliveryZone: z.enum(["nairobi", "outside"]).default("nairobi"),
  deliveryArea: z.string().optional().nullable(),
  items: z.array(orderItemSchema).min(1, "Cart is empty"),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

function makeRef(): string {
  // Short, human-friendly, time-based ref e.g. AA-8F3K2
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 5; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `AA-${s}`;
}

/**
 * Move stock for an order's items. `sign` is -1 when an order is placed and
 * +1 when it is cancelled and the pieces go back on the shelf. Bespoke items
 * and free-text items (no productId) are skipped, and stock never goes below 0.
 * Returns the ids of the products touched so their alerts can be re-checked.
 */
export async function adjustStock(
  items: { productId?: string | null; qty: number }[],
  sign: -1 | 1
): Promise<string[]> {
  const wanted = new Map<string, number>();
  for (const i of items) {
    if (!i.productId) continue;
    wanted.set(i.productId, (wanted.get(i.productId) ?? 0) + i.qty);
  }
  if (wanted.size === 0) return [];

  const products = await prisma.product.findMany({
    where: { id: { in: [...wanted.keys()] }, bespoke: false },
    select: { id: true, inStock: true },
  });

  const touched: string[] = [];
  for (const p of products) {
    const next = Math.max(0, p.inStock + sign * (wanted.get(p.id) ?? 0));
    if (next === p.inStock) continue;
    await prisma.product.update({ where: { id: p.id }, data: { inStock: next } });
    touched.push(p.id);
  }
  return touched;
}

export async function createOrder(input: CreateOrderInput) {
  const data = createOrderSchema.parse(input);
  const zone = getZone(data.deliveryZone);

  // Pay on delivery is only offered where we deliver ourselves.
  if (data.channel === "cod" && !zone.payOnDelivery) {
    throw new Error(
      "Payment on delivery is only available in Nairobi & environs. Please choose another payment method."
    );
  }

  const total = data.items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const ref = makeRef();

  const order = await prisma.order.create({
    data: {
      ref,
      customerName: data.customerName,
      email: data.email,
      phone: data.phone,
      address: data.address ?? null,
      city: data.city ?? null,
      notes: data.notes ?? null,
      channel: data.channel,
      total,
      paymentStatus: "pending",
      deliveryZone: zone.key,
      deliveryArea: data.deliveryArea || data.city || null,
      deliveryFee: 0, // quoted by the shop once the location is known
      payOnDelivery: data.channel === "cod",
      items: {
        create: data.items.map((i) => ({
          productId: i.productId,
          name: i.name,
          color: i.color ?? null,
          size: i.size ?? null,
          price: i.price,
          qty: i.qty,
        })),
      },
    },
    include: { items: true },
  });

  // Take the pieces out of stock, then raise alerts for anything now low/out.
  try {
    const touched = await adjustStock(order.items, -1);
    for (const id of touched) await reviewStockFor(id);
  } catch (err) {
    console.error("[orders] stock adjustment failed:", err);
  }

  // Admin alert — shows in the bell in /admin straight away.
  await notifyNewOrder({
    id: order.id,
    ref: order.ref,
    customerName: order.customerName,
    channel: order.channel,
    total: order.total,
    deliveryZone: order.deliveryZone,
    payOnDelivery: order.payOnDelivery,
    items: order.items,
  });

  // Fire-and-forget notification (won't block/fail the order).
  await sendOrderEmails({
    ref: order.ref,
    customerName: order.customerName,
    email: order.email,
    phone: order.phone,
    address: order.address,
    city: order.city,
    notes: order.notes,
    channel: order.channel,
    total: order.total,
    deliveryZone: order.deliveryZone,
    deliveryArea: order.deliveryArea,
    payOnDelivery: order.payOnDelivery,
    items: order.items,
  });

  return order;
}

export async function markOrderPaid(ref: string, paymentRef: string) {
  const order = await prisma.order.update({
    where: { ref },
    data: { paymentStatus: "paid", status: "confirmed", paymentRef },
  });
  await notifyOrderPaid({ ref: order.ref, total: order.total + order.deliveryFee, paymentRef });
  return order;
}
