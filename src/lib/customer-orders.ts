import "server-only";
import { prisma } from "./prisma";
import type { TrackedOrder } from "@/components/account/OrderTracker";

/**
 * Orders as the customer is allowed to see them.
 *
 * Deliberately a narrow projection: internal notes, payment references and the
 * admin's working fields never leave the server. Product images are joined in
 * so the tracking view can show what was bought.
 */

const selection = {
  ref: true,
  status: true,
  paymentStatus: true,
  channel: true,
  payOnDelivery: true,
  total: true,
  deliveryFee: true,
  deliveryZone: true,
  deliveryArea: true,
  address: true,
  createdAt: true,
  items: {
    select: {
      id: true,
      name: true,
      qty: true,
      price: true,
      color: true,
      size: true,
      product: { select: { images: true, slug: true } },
    },
  },
} as const;

type Row = {
  ref: string;
  status: string;
  paymentStatus: string;
  channel: string;
  payOnDelivery: boolean;
  total: number;
  deliveryFee: number;
  deliveryZone: string;
  deliveryArea: string | null;
  address: string | null;
  createdAt: Date;
  items: {
    id: string;
    name: string;
    qty: number;
    price: number;
    color: string | null;
    size: string | null;
    product: { images: string; slug: string } | null;
  }[];
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

function toTracked(row: Row): TrackedOrder {
  return {
    ref: row.ref,
    status: row.status,
    paymentStatus: row.paymentStatus,
    channel: row.channel,
    payOnDelivery: row.payOnDelivery,
    total: row.total,
    deliveryFee: row.deliveryFee,
    deliveryZone: row.deliveryZone,
    deliveryArea: row.deliveryArea,
    address: row.address,
    createdAt: row.createdAt.toISOString(),
    items: row.items.map((i) => ({
      id: i.id,
      name: i.name,
      qty: i.qty,
      price: i.price,
      color: i.color,
      size: i.size,
      image: firstImage(i.product?.images),
      slug: i.product?.slug ?? null,
    })),
  };
}

/** Every order belonging to a signed-in account, newest first. */
export async function getOrdersForUser(userId: string): Promise<TrackedOrder[]> {
  const rows = (await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: selection,
  })) as unknown as Row[];
  return rows.map(toTracked);
}

/**
 * Guest lookup: reference plus the email it was placed with.
 *
 * Both are required on purpose — a reference alone is short and guessable, and
 * order records carry a name, phone and address. Requiring the email keeps a
 * stranger from enumerating other people's orders.
 */
export async function findOrderForGuest(
  ref: string,
  email: string
): Promise<TrackedOrder | null> {
  const cleanRef = ref.trim().toUpperCase();
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanRef || !cleanEmail) return null;

  const row = (await prisma.order.findFirst({
    where: { ref: cleanRef, email: { equals: cleanEmail, mode: "insensitive" } },
    select: selection,
  })) as unknown as Row | null;

  return row ? toTracked(row) : null;
}
