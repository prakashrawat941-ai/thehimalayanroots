"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSessionUser, requireAdmin } from "@/lib/auth";
import { isBookable } from "@/lib/data/listings";
import { getListing, getListings } from "@/lib/cms/queries";
import { buildItinerary, toPlannerListing } from "@/lib/planner";
import { bookingSchema, bookingStatusSchema, nightsBetween, todayISO, tripPlanSchema } from "@/lib/validation";
import type { FormState } from "./auth";

export async function createBooking(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return { error: "Bookings are not available yet: Supabase is not configured." };

  const user = await getSessionUser();
  if (!user) return { error: "Please sign in to book." };

  const parsed = bookingSchema.safeParse({
    kind: formData.get("kind"),
    slug: formData.get("slug"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate") || formData.get("startDate"),
    guests: formData.get("guests"),
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  const input = parsed.data;

  if (input.startDate < todayISO()) return { fieldErrors: { startDate: ["Choose a future date"] } };

  const listing = await getListing(input.kind, input.slug);
  if (!listing || !isBookable(listing.kind)) return { error: "That listing is not available." };

  const capacity = listing.homestay?.maxGuests;
  if (capacity && input.guests > capacity) return { fieldErrors: { guests: [`Maximum ${capacity} guests`] } };

  // Price is always computed on the server from the catalogue; client values are ignored.
  const total = listing.priceUnit === "night"
    ? listing.price * nightsBetween(input.startDate, input.endDate)
    : listing.price * input.guests;

  const supabase = await createClient();
  const { error } = await supabase.from("bookings").insert({
    user_id: user.id,
    listing_kind: listing.kind,
    listing_slug: listing.slug,
    listing_title: listing.title,
    start_date: input.startDate,
    end_date: input.endDate,
    guests: input.guests,
    total_inr: total,
    notes: input.notes || null,
  });
  if (error) return { error: "We couldn't save your booking. Please try again." };

  revalidatePath("/dashboard");
  revalidatePath("/admin");
  return { message: "Request received. We'll confirm your booking shortly; payment is collected after confirmation." };
}

export async function cancelBooking(formData: FormData): Promise<void> {
  const user = await getSessionUser();
  const id = formData.get("id");
  if (!user || typeof id !== "string") return;
  const parsed = bookingStatusSchema.safeParse({ id, status: "cancelled" });
  if (!parsed.success) return;
  const supabase = await createClient();
  // RLS and the guard trigger restrict this to the user's own active bookings.
  await supabase.from("bookings").update({ status: "cancelled" }).eq("id", parsed.data.id).eq("user_id", user.id);
  revalidatePath("/dashboard");
  revalidatePath("/admin");
}

export async function updateBookingStatus(formData: FormData): Promise<void> {
  await requireAdmin();
  const parsed = bookingStatusSchema.safeParse({ id: formData.get("id"), status: formData.get("status") });
  if (!parsed.success) return;
  const supabase = await createClient();
  await supabase.from("bookings").update({ status: parsed.data.status }).eq("id", parsed.data.id);
  revalidatePath("/admin");
  revalidatePath("/dashboard");
}

export async function saveTripPlan(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return { error: "Saving plans is not available yet: Supabase is not configured." };
  const user = await getSessionUser();
  if (!user) return { error: "Sign in to save your plan." };

  const parsed = tripPlanSchema.safeParse({
    region: formData.get("region"),
    travelMonth: formData.get("travelMonth"),
    days: formData.get("days"),
    travellers: formData.get("travellers"),
    budget: formData.get("budget"),
    interests: formData.getAll("interests").map(String),
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  const p = parsed.data;

  const itinerary = buildItinerary(p, (await getListings()).map(toPlannerListing));

  const supabase = await createClient();
  const { error } = await supabase.from("trip_plans").insert({
    user_id: user.id,
    region: p.region,
    travel_month: p.travelMonth,
    days: p.days,
    travellers: p.travellers,
    budget_inr: p.budget,
    interests: p.interests,
    itinerary,
    notes: p.notes || null,
  });
  if (error) return { error: "We couldn't save your plan. Please try again." };
  revalidatePath("/dashboard");
  return { message: "Plan saved to your dashboard." };
}
