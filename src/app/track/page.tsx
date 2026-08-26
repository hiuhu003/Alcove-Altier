import type { Metadata } from "next";
import { TrackForm } from "@/components/account/TrackForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Track your order",
  description:
    "Follow your Alcove Atelier order from confirmation to delivery. Enter your order reference and email to see its progress.",
  alternates: { canonical: "/track" },
};

export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  return <TrackForm initialRef={ref ?? ""} />;
}
