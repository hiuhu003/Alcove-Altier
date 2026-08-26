import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { getCurrentUser, landingPageFor } from "@/lib/users";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Create an account",
  description:
    "Create an Alcove Atelier account to save your details, follow your orders and reorder quickly.",
  robots: { index: false, follow: true },
};

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect(next || landingPageFor(user));

  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : undefined;
  return <AuthForm mode="signup" redirectTo={safeNext} />;
}
