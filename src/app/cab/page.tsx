import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { CabBooking } from "@/components/CabBooking";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Cab booking", description: "Book a cab to or from any village in Garhwal and Kumaon." };

export default async function CabPage() {
  const user = await getSessionUser();
  return (
    <>
      <PageHero eyebrow="Getting there" title="A cab to the last village on the road" intro="Search any village, town or landmark across India, or drop a pin on the map." seed="cab" palette="pine" />
      <section className="mx-auto max-w-2xl px-5 py-12 lg:py-16"><CabBooking signedIn={Boolean(user)} /></section>
    </>
  );
}
