import { NextResponse } from "next/server";
import { z } from "zod";
import { guardAdminApi } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { getCurrentUser } from "@/lib/users";
import { sendAdminInviteEmail, isEmailConfigured } from "@/lib/email";
import { isPublicError, PublicError } from "@/lib/errors";

export const dynamic = "force-dynamic";

const inviteSchema = z.object({
  name: z.string().trim().min(2, "Please give them a name").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Use at least 8 characters")
    .max(200, "That password is too long"),
});

/** Everyone with an account, admins first. */
export async function GET() {
  const denied = await guardAdminApi();
  if (denied) return denied;

  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { orders: true } },
    },
  });

  return NextResponse.json({
    ok: true,
    emailConfigured: isEmailConfigured(),
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      orders: u._count.orders,
      createdAt: u.createdAt.toISOString(),
    })),
  });
}

/**
 * Give someone admin access by email + password.
 *
 * Re-runnable: an existing customer is promoted (and their password reset)
 * rather than duplicated, which is what "make this person an admin" means when
 * they already shop here.
 */
export async function POST(req: Request) {
  const denied = await guardAdminApi();
  if (denied) return denied;

  try {
    const actor = await getCurrentUser();
    const data = inviteSchema.parse(await req.json());

    const existing = await prisma.user.findUnique({
      where: { email: data.email },
      select: { id: true, role: true },
    });
    if (existing?.role === "admin") {
      throw new PublicError("That person is already an admin.", 409);
    }

    const passwordHash = await hashPassword(data.password);
    const user = await prisma.user.upsert({
      where: { email: data.email },
      update: { role: "admin", passwordHash, name: data.name },
      create: { email: data.email, name: data.name, passwordHash, role: "admin" },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    // Any orders they placed as a customer stay with them.
    await prisma.order
      .updateMany({ where: { email: data.email, userId: null }, data: { userId: user.id } })
      .catch(() => null);

    // Best-effort: the account exists whether or not the email goes out, so a
    // mail failure is reported rather than rolled back.
    const emailed = await sendAdminInviteEmail({
      name: user.name,
      email: user.email,
      password: data.password,
      invitedBy: actor?.name ?? "An administrator",
    });

    return NextResponse.json({
      ok: true,
      emailed,
      promoted: Boolean(existing),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        orders: 0,
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (err) {
    if (isPublicError(err)) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: err.issues[0]?.message ?? "Please check those details." },
        { status: 400 }
      );
    }
    console.error("[admin/users] invite failed:", err);
    return NextResponse.json(
      { ok: false, error: "Could not create that admin. Please try again." },
      { status: 500 }
    );
  }
}
