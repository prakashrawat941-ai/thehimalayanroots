import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { PlannerForm } from "@/components/PlannerForm";
import { getSessionUser } from "@/lib/auth";
import { getListings } from "@/lib/cms/queries";
import { toPlannerListing } from "@/lib/planner";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Trip planner", description: "Build a Garhwal and Kumaon itinerary around your time, budget and interests." };

export default async function TripPlannerPage() {
  const [user, listings] = await Promise.all([getSessionUser(), getListings()]);
  return (
    <>
      <PageHero eyebrow="Plan" title="Shape your Himalayan route" intro="Tell us your time, budget and interests. We will suggest a route you can save and refine." seed="planner" palette="dawn" />
      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8"><PlannerForm signedIn={Boolean(user)} listings={listings.map(toPlannerListing)} /></section>
    </>
  );
}
