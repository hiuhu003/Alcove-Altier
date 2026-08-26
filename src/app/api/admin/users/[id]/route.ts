import { NextResponse } from "next/server";
import { guardAdminApi } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/users";

export const dynamic = "force-dynamic";

/**
 * Remove someone's admin access (they stay a customer).
 *
 * Two guards: you cannot demote yourself — that is how someone locks the whole
 * team out mid-session — and the last remaining admin cannot be demoted, which
 * would leave the dashboard unreachable for everyone.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await guardAdminApi();
  if (denied) return denied;

  const { id } = await params;
  const actor = await getCurrentUser();

  if (actor?.id === id) {
    return NextResponse.json(
      { ok: false, error: "You can't remove your own admin access." },
      { status: 400 }
    );
  }

  const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (!target) {
    return NextResponse.json({ ok: false, error: "That account no longer exists." }, { status: 404 });
  }
  if (target.role !== "admin") {
    return NextResponse.json({ ok: false, error: "That person isn't an admin." }, { status: 400 });
  }

  const admins = await prisma.user.count({ where: { role: "admin" } });
  if (admins <= 1) {
    return NextResponse.json(
      { ok: false, error: "This is the only admin — promote someone else first." },
      { status: 400 }
    );
  }

  await prisma.user.update({ where: { id }, data: { role: "customer" } });
  return NextResponse.json({ ok: true });
}
