import "server-only";
import { createClient } from "@/lib/supabase/server";
import { LISTING_SELECT, MEDIA_COLUMNS, toListing, toMedia, toSection, type ListingRow, type MediaRow } from "./queries";
import type { ListingKind } from "@/lib/data/types";
import type { Media } from "./types";

/** Uncached reads for /admin through the signed-in user's session, so RLS still applies and drafts are visible. */
export async function adminDb() {
  return createClient();
}

export async function getLibrary(): Promise<Media[]> {
  const db = await adminDb();
  const { data } = await db.from("media").select(MEDIA_COLUMNS).order("created_at", { ascending: false }).limit(500);
  return ((data ?? []) as MediaRow[]).map((r) => toMedia(r)!);
}

export async function getAdminSections() {
  const db = await adminDb();
  const { data } = await db.from("home_sections").select("*").order("position");
  return ((data ?? []) as Parameters<typeof toSection>[0][]).map(toSection);
}

export async function getAdminListings(kind: ListingKind) {
  const db = await adminDb();
  const { data } = await db.from("listings").select(LISTING_SELECT).eq("kind", kind).order("position").order("title");
  return ((data ?? []) as ListingRow[]).map(toListing);
}

export async function getAdminListing(id: string) {
  const db = await adminDb();
  const { data } = await db.from("listings").select(`${LISTING_SELECT}, gallery:listing_media(position, media(${MEDIA_COLUMNS}))`).eq("id", id).maybeSingle();
  return data ? toListing(data as ListingRow) : null;
}

/** Counts for the sidebar badges and the overview. */
export async function getCounts() {
  const db = await adminDb();
  const c = (q: PromiseLike<{ count: number | null }>) => Promise.resolve(q).then((r) => r.count ?? 0);
  const head = { count: "exact" as const, head: true };
  const [pendingReviews, newMessages, pendingBookings, pendingCabs, published, drafts, users, media] = await Promise.all([
    c(db.from("reviews").select("id", head).eq("status", "pending")),
    c(db.from("contact_messages").select("id", head).eq("status", "new")),
    c(db.from("bookings").select("id", head).eq("status", "pending")),
    c(db.from("cab_requests").select("id", head).eq("status", "pending")),
    c(db.from("listings").select("id", head).eq("status", "published")),
    c(db.from("listings").select("id", head).eq("status", "draft")),
    c(db.from("profiles").select("id", head)),
    c(db.from("media").select("id", head)),
  ]);
  return { pendingReviews, newMessages, pendingBookings, pendingCabs, published, drafts, users, media };
}

/** Clock reads live here, outside render, so admin pages stay pure. */
export const nowMs = () => Date.now();
export const daysAgoIso = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();
