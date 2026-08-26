import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/users";
import { sendContactMessageEmail, isEmailConfigured } from "@/lib/email";
import { forbidden, isSameOrigin } from "@/lib/http";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().trim().min(2, "Please tell us your name").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(254),
  message: z
    .string()
    .trim()
    .min(5, "Please write a little more")
    .max(4000, "That message is too long"),
});

/**
 * Contact form.
 *
 * The message is saved first and emailed second, on purpose: with no mail
 * provider configured the email is only logged, and an enquiry that exists
 * nowhere is worse than one that hasn't been forwarded yet. The customer is
 * told it arrived either way, because from their side it has.
 */
export async function POST(req: Request) {
  if (!(await isSameOrigin())) return forbidden();

  const limit = rateLimit(`contact:${clientIp(req)}`, 5, 30 * 60 * 1000);
  if (!limit.ok) {
    return tooManyRequests(limit, "Thanks — we already have your note. Please give us a little time to reply.");
  }

  try {
    const data = schema.parse(await req.json());
    const user = await getCurrentUser();

    const emailed = await sendContactMessageEmail({
      name: data.name,
      email: data.email,
      body: data.message,
    });

    await prisma.contactMessage.create({
      data: {
        name: data.name,
        email: data.email,
        message: data.message,
        userId: user?.id ?? null,
        emailed,
      },
    });

    if (!emailed && !isEmailConfigured()) {
      console.warn("[contact] message saved but not emailed - no mail provider configured");
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: err.issues[0]?.message ?? "Please check your details." },
        { status: 400 }
      );
    }
    console.error("[contact] failed:", err);
    return NextResponse.json(
      { ok: false, error: "We couldn't send that just now. Please try WhatsApp instead." },
      { status: 500 }
    );
  }
}
