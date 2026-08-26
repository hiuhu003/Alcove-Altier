import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { getCurrentUser, landingPageFor } from "@/lib/users";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to your Alcove Atelier account to track your orders and check out faster.",
  robots: { index: false, follow: true },
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  // Already signed in? Don't show a login form - send them where they belong.
  const user = await getCurrentUser();
  if (user) redirect(next || landingPageFor(user));

  // Only allow in-app destinations, so ?next= can't be used to bounce someone
  // to another site after login.
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : undefined;

  return <AuthForm mode="signin" redirectTo={safeNext} />;
}
