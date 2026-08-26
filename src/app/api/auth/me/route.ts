import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/users";

export const dynamic = "force-dynamic";

/**
 * Who is signed in, for the header.
 *
 * Deliberately a separate endpoint rather than reading cookies in the root
 * layout: touching cookies there would opt every storefront page out of static
 * rendering, costing the SEO and speed benefits of ISR. Returns only what the
 * header needs to draw itself.
 */
export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json(
    {
      ok: true,
      user: user
        ? { name: user.name, email: user.email, phone: user.phone, role: user.role }
        : null,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
