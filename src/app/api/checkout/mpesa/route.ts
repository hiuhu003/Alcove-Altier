import { NextResponse } from "next/server";
import { z } from "zod";
import { isMpesaConfigured, stkPush } from "@/lib/mpesa";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  ref: z.string(),
  phone: z.string().min(7),
  amount: z.number().positive(),
});

export async function POST(req: Request) {
  const { ref, phone, amount } = schema.parse(await req.json());

  if (!isMpesaConfigured()) {
    return NextResponse.json({
      ok: false,
      needsConfig: true,
      message:
        "M-Pesa isn't connected yet. Add your Daraja keys to enable STK Push, or complete the order on WhatsApp.",
    });
  }

  try {
    const result = await stkPush({
      phone,
      amount,
      accountRef: ref,
      description: "Alcove order",
    });

    // Store the CheckoutRequestID on the order so the async callback can match
    // it back to this order and mark it paid.
    await prisma.order
      .update({ where: { ref }, data: { paymentRef: result.CheckoutRequestID } })
      .catch(() => null);

    return NextResponse.json({
      ok: true,
      checkoutRequestId: result.CheckoutRequestID,
      message: result.CustomerMessage,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "STK push failed";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
