"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSessionUser, requireAdmin } from "@/lib/auth";
import { getListings } from "@/lib/cms/queries";
import { buildItinerary, toPlannerListing } from "@/lib/planner";
import { bookingSchema, bookingStatusSchema, todayISO, tripPlanSchema } from "@/lib/validation";
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

  // PostgreSQL loads the published listing and calculates the authoritative price.
  // The browser cannot forge listing metadata or total_inr through the public REST API.
  const supabase = await createClient();
  const { error } = await supabase.rpc("create_booking", {
    p_listing_kind: input.kind,
    p_listing_slug: input.slug,
    p_start_date: input.startDate,
    p_end_date: input.endDate,
    p_guests: input.guests,
    p_notes: input.notes || null,
  });
  if (error) {
    console.error("[booking] create failed:", error.message);
    return { error: "We couldn't save your booking. Please check the dates and guest count, then try again." };
  }

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
  // RLS and the database trigger restrict this to the user's own active bookings.
  await supabase.from("bookings").update({ status: "cancelled" }).eq("id", parsed.data.id).eq("user_id", user.id);
  revalidatePath("/dashboard");
  revalidatePath("/admin");
}

export async function updateBookingStatus(formData: FormData): Promise<void> {
  await requireAdmin();
  const parsed = bookingStatusSchema.safeParse({ id: formData.get("id"), status: formData.get("status") });
  if (!parsed.success) return;
  const supabase = await createClient();
  const { error } = await supabase.from("bookings").update({ status: parsed.data.status }).eq("id", parsed.data.id);
  if (error) console.error("[booking] status update failed:", error.message);
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
