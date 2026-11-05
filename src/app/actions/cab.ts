"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSessionUser } from "@/lib/auth";
import { cabSchema, istToDate } from "@/lib/validation";
import type { FormState } from "./auth";

export async function createCabRequest(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return { error: "Cab requests are not available yet: Supabase is not configured." };

  const user = await getSessionUser();
  if (!user) return { error: "Please sign in to request a cab." };

  const parsed = cabSchema.safeParse({
    pickup: formData.get("pickup"),
    drop: formData.get("drop"),
    pickupAt: formData.get("pickupAt"),
    passengers: formData.get("passengers"),
    vehicle: formData.get("vehicle"),
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  const { pickup, drop, pickupAt, passengers, vehicle, notes } = parsed.data;

  const when = istToDate(pickupAt);
  if (Number.isNaN(when.getTime()) || when.getTime() < Date.now() + 15 * 60_000) {
    return { fieldErrors: { pickupAt: ["Choose a time at least 15 minutes from now"] } };
  }
  if (pickup.placeId === drop.placeId) return { fieldErrors: { drop: ["Pickup and drop can't be the same place"] } };

  const supabase = await createClient();
  const { error } = await supabase.from("cab_requests").insert({
    user_id: user.id,
    pickup_place_id: pickup.placeId,
    pickup_address: pickup.formattedAddress,
    pickup_lat: pickup.lat,
    pickup_lng: pickup.lng,
    pickup_details: pickup,
    drop_place_id: drop.placeId,
    drop_address: drop.formattedAddress,
    drop_lat: drop.lat,
    drop_lng: drop.lng,
    drop_details: drop,
    pickup_at: when.toISOString(),
    passengers,
    vehicle,
    notes: notes || null,
  });
  if (error) return { error: "We couldn't save your request. Please try again." };

  revalidatePath("/dashboard");
  return { message: "Cab request received. We'll confirm your driver and fare shortly; no payment is taken now." };
}
