"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import sharp, { type OutputInfo } from "sharp";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSessionUser, requireAdmin, requireStaff } from "@/lib/auth";
import { CMS_TAG, MEDIA_COLUMNS, toMedia, type MediaRow } from "@/lib/cms/queries";
import { COLOR_KEYS, SOCIAL_KEYS, type Media } from "@/lib/cms/types";
import {
  aboutSchema, adSchema, contactSchema, idSchema, listingSchema, mediaUpdateSchema, reviewAdminSchema,
  reviewSubmitSchema, roleSchema, sectionSchema, settingsSchema, teamSchema,
} from "@/lib/cms/schemas";
import { rateLimit } from "@/lib/places";
import type { FormState } from "./auth";

// ---------- helpers ----------

const NOT_CONFIGURED: FormState = { error: "The CMS needs Supabase. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY." };

async function staff() {
  if (!isSupabaseConfigured) return null;
  const user = await requireStaff();
  return { user, db: await createClient() };
}

/** Make the change visible on the live site immediately and refresh admin lists. */
function published() {
  updateTag(CMS_TAG);
  revalidatePath("/admin", "layout");
}

const fields = (fd: FormData, prefix: string, keys: readonly string[]) =>
  Object.fromEntries(keys.map((k) => [k, String(fd.get(`${prefix}.${k}`) ?? "").trim()]));

const invalid = (e: z.ZodError): FormState => ({ error: "Please fix the highlighted fields.", fieldErrors: e.flatten().fieldErrors as FormState["fieldErrors"] });

function dbError(error: { code?: string; message: string } | null, where: string): FormState | null {
  if (!error) return null;
  console.error(`[cms] ${where}: ${error.code} ${error.message}`);
  if (error.code === "23505") return { error: "That slug is already used by another item of this type.", fieldErrors: { slug: ["Already in use"] } };
  if (error.code === "42501") return { error: "You don't have permission to do that." };
  if (error.code === "23514") return { error: "A value is outside the allowed range." };
  return { error: "Couldn't save. Please try again." };
}

const nullify = <T extends Record<string, unknown>>(o: T) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== ""));

async function clientIp() {
  return (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}

// ---------- settings & about ----------

export async function saveSettings(_p: FormState, fd: FormData): Promise<FormState> {
  const s = await staff(); if (!s) return NOT_CONFIGURED;
  const parsed = settingsSchema.safeParse({
    siteName: fd.get("siteName"), tagline: fd.get("tagline"), description: fd.get("description"), footerNote: fd.get("footerNote"),
    logoMediaId: fd.get("logoMediaId"), faviconMediaId: fd.get("faviconMediaId"),
    colors: fields(fd, "color", COLOR_KEYS), social: fields(fd, "social", SOCIAL_KEYS),
    contact: fields(fd, "contact", ["email", "phone", "whatsapp", "address", "hours", "mapUrl"]),
  });
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;
  const { error } = await s.db.from("site_settings").update({
    site_name: v.siteName, tagline: v.tagline, description: v.description, footer_note: v.footerNote,
    logo_media_id: v.logoMediaId, favicon_media_id: v.faviconMediaId,
    colors: nullify(v.colors), social: nullify(v.social), contact: nullify(v.contact),
  }).eq("id", 1);
  const err = dbError(error, "settings"); if (err) return err;
  published();
  return { message: "Settings saved and published." };
}

export async function saveAbout(_p: FormState, fd: FormData): Promise<FormState> {
  const s = await staff(); if (!s) return NOT_CONFIGURED;
  const parsed = aboutSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return invalid(parsed.error);
  const { error } = await s.db.from("site_settings").update({ about: nullify({ ...parsed.data, coverMediaId: parsed.data.coverMediaId ?? undefined }) }).eq("id", 1);
  const err = dbError(error, "about"); if (err) return err;
  published();
  return { message: "Our Story saved and published." };
}

// ---------- homepage sections ----------

export async function saveSection(_p: FormState, fd: FormData): Promise<FormState> {
  const s = await staff(); if (!s) return NOT_CONFIGURED;
  const id = String(fd.get("id") ?? "");
  const parsed = sectionSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;
  const row = {
    type: v.type, enabled: v.enabled, eyebrow: v.eyebrow, title: v.title, accent: v.accent, body: v.body,
    cta_label: v.ctaLabel, cta_url: v.ctaUrl, cta2_label: v.cta2Label, cta2_url: v.cta2Url, media_id: v.mediaId, data: v.data,
  };
  if (id === "new") {
    const { data: last } = await s.db.from("home_sections").select("position").order("position", { ascending: false }).limit(1).maybeSingle();
    const { data, error } = await s.db.from("home_sections").insert({ ...row, position: (last?.position ?? 0) + 10 }).select("id").single();
    const err = dbError(error, "section insert"); if (err) return err;
    published();
    redirect(`/admin/home/${data!.id}?saved=1`);
  }
  if (!idSchema.safeParse({ id }).success) return { error: "Unknown section." };
  const err = dbError((await s.db.from("home_sections").update(row).eq("id", id)).error, "section update"); if (err) return err;
  published();
  return { message: "Section saved and published." };
}

export async function moveSection(fd: FormData) {
  const s = await staff(); if (!s) return;
  const id = String(fd.get("id")); const dir = fd.get("dir") === "up" ? "up" : "down";
  const { data } = await s.db.from("home_sections").select("id, position").order("position");
  const rows = (data ?? []) as { id: string; position: number }[];
  const i = rows.findIndex((r) => r.id === id); const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= rows.length) return;
  // Renumber everything so positions stay unique and evenly spaced.
  [rows[i], rows[j]] = [rows[j], rows[i]];
  await Promise.all(rows.map((r, k) => (r.position === k * 10 ? null : s.db.from("home_sections").update({ position: k * 10 }).eq("id", r.id))));
  published();
}

export async function toggleSection(fd: FormData) {
  const s = await staff(); if (!s) return;
  const p = idSchema.safeParse({ id: fd.get("id") }); if (!p.success) return;
  await s.db.from("home_sections").update({ enabled: fd.get("enabled") === "true" }).eq("id", p.data.id);
  published();
}

export async function deleteSection(fd: FormData) {
  const s = await staff(); if (!s) return;
  const p = idSchema.safeParse({ id: fd.get("id") }); if (!p.success) return;
  await s.db.from("home_sections").delete().eq("id", p.data.id);
  published();
  redirect("/admin/home");
}

// ---------- listings (destinations, homestays, experiences, treks, workations) ----------

export async function saveListing(_p: FormState, fd: FormData): Promise<FormState> {
  const s = await staff(); if (!s) return NOT_CONFIGURED;
  const id = String(fd.get("id") ?? "");
  const parsed = listingSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;
  const details: Record<string, unknown> = {};
  if (v.kind === "trekking" && v.trekDifficulty && v.trekDays) details.trek = { difficulty: v.trekDifficulty, days: v.trekDays, maxAltitudeM: v.trekAltitude ?? 0, bestSeason: v.trekSeason ?? v.bestSeason ?? "" };
  if (v.kind === "homestays" && v.rooms && v.maxGuests) details.homestay = { rooms: v.rooms, maxGuests: v.maxGuests, meals: v.meals ?? "" };
  if (v.kind === "workation" && v.wifiMbps !== undefined) details.workation = { wifiMbps: v.wifiMbps, powerBackup: v.powerBackup, deskSetup: v.deskSetup };

  const row = {
    kind: v.kind, slug: v.slug, title: v.title, tagline: v.tagline, region: v.region, location: v.location,
    district: v.district ?? null, state: v.state, lat: v.lat ?? null, lng: v.lng ?? null, description: v.description,
    highlights: v.highlights, attractions: v.attractions, facilities: v.facilities, tags: v.tags,
    travel_info: v.travelInfo ?? null, best_season: v.bestSeason ?? null, how_to_reach: v.howToReach ?? null,
    price: v.priceUnit === "free" ? 0 : v.price, price_unit: v.priceUnit, details, palette: v.palette,
    status: v.status, featured: v.featured, position: v.position, cover_media_id: v.coverMediaId,
  };

  let listingId = id;
  if (id === "new") {
    const { data, error } = await s.db.from("listings").insert(row).select("id").single();
    const err = dbError(error, "listing insert"); if (err) return err;
    listingId = data!.id;
  } else {
    if (!idSchema.safeParse({ id }).success) return { error: "Unknown listing." };
    const err = dbError((await s.db.from("listings").update(row).eq("id", id)).error, "listing update"); if (err) return err;
  }

  // Replace the gallery in its submitted order.
  await s.db.from("listing_media").delete().eq("listing_id", listingId);
  if (v.galleryIds.length) {
    const err = dbError((await s.db.from("listing_media").insert(v.galleryIds.map((m, i) => ({ listing_id: listingId, media_id: m, position: i })))).error, "gallery");
    if (err) return err;
  }
  published();
  if (id === "new") redirect(`/admin/listings/${listingId}?saved=1`);
  return { message: v.status === "published" ? "Saved and live on the website." : "Saved as draft (not visible on the website)." };
}

export async function deleteListing(fd: FormData) {
  const s = await staff(); if (!s) return;
  const p = idSchema.safeParse({ id: fd.get("id") }); if (!p.success) return;
  const kind = String(fd.get("kind") ?? "villages");
  await s.db.from("listings").delete().eq("id", p.data.id);
  published();
  redirect(`/admin/listings?kind=${encodeURIComponent(kind)}`);
}

// ---------- media library ----------

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_WIDTH = 2560;

/** Upload one or more images. Each is re-encoded (strips EXIF/GPS, normalises orientation, caps size). */
export async function uploadMedia(fd: FormData): Promise<{ error?: string; media?: Media[] }> {
  const s = await staff(); if (!s) return { error: NOT_CONFIGURED.error };
  const files = fd.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return { error: "Choose at least one image." };
  if (files.length > 10) return { error: "Upload at most 10 images at a time." };
  const alt = String(fd.get("alt") ?? "").trim().slice(0, 300);

  const out: Media[] = [];
  for (const file of files) {
    if (file.size > MAX_BYTES) return { error: `${file.name} is larger than 10 MB.`, media: out };
    let encoded: { data: Buffer; info: OutputInfo };
    let blur: string;
    try {
      const input = Buffer.from(await file.arrayBuffer());
      const meta = await sharp(input).metadata(); // detects the real format; the browser-supplied type is not trusted
      if (!meta.format || !["jpeg", "png", "webp", "avif", "heif"].includes(meta.format)) return { error: `${file.name} is not a supported image.`, media: out };
      encoded = await sharp(input).rotate().resize({ width: MAX_WIDTH, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer({ resolveWithObject: true });
      blur = `data:image/webp;base64,${(await sharp(encoded.data).resize(20).webp({ quality: 40 }).toBuffer()).toString("base64")}`;
    } catch {
      return { error: `${file.name} could not be read as an image.`, media: out };
    }
    const now = new Date();
    const path = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${randomUUID()}.webp`;
    const up = await s.db.storage.from("media").upload(path, encoded.data, { contentType: "image/webp", cacheControl: "31536000", upsert: false });
    if (up.error) { console.error("[cms] upload", up.error.message); return { error: "Upload failed. Check that the media bucket exists.", media: out }; }
    const url = s.db.storage.from("media").getPublicUrl(path).data.publicUrl;
    const { data, error } = await s.db.from("media").insert({
      path, url, alt: alt || file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").slice(0, 300),
      width: encoded.info.width, height: encoded.info.height, blur, created_by: s.user.id,
    }).select(MEDIA_COLUMNS).single();
    if (error) { await s.db.storage.from("media").remove([path]); return { error: "Couldn't save the image record.", media: out }; }
    out.push(toMedia(data as MediaRow)!);
  }
  published();
  return { media: out };
}

export async function updateMedia(_p: FormState, fd: FormData): Promise<FormState> {
  const s = await staff(); if (!s) return NOT_CONFIGURED;
  const parsed = mediaUpdateSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;
  const err = dbError((await s.db.from("media").update({
    alt: v.alt, caption: v.caption ?? null, credit: v.credit ?? null, license: v.license ?? null,
    license_url: v.licenseUrl ?? null, source_url: v.sourceUrl ?? null,
  }).eq("id", v.id)).error, "media update");
  if (err) return err;
  published();
  return { message: "Image details saved." };
}

export async function deleteMedia(fd: FormData) {
  const s = await staff(); if (!s) return;
  const p = idSchema.safeParse({ id: fd.get("id") }); if (!p.success) return;
  const { data } = await s.db.from("media").select("path").eq("id", p.data.id).maybeSingle();
  // References elsewhere are cleared by ON DELETE SET NULL / CASCADE.
  const { error } = await s.db.from("media").delete().eq("id", p.data.id);
  if (!error && data?.path) await s.db.storage.from("media").remove([data.path]);
  published();
}

// ---------- reviews ----------

export async function saveReview(_p: FormState, fd: FormData): Promise<FormState> {
  const s = await staff(); if (!s) return NOT_CONFIGURED;
  const id = String(fd.get("id") ?? "");
  const parsed = reviewAdminSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;
  const row = { name: v.name, location: v.location ?? null, rating: v.rating, title: v.title ?? null, body: v.body, status: v.status, featured: v.featured && v.status === "approved", photo_media_id: v.photoMediaId };
  const res = id === "new" ? await s.db.from("reviews").insert(row) : await s.db.from("reviews").update(row).eq("id", id);
  const err = dbError(res.error, "review"); if (err) return err;
  published();
  if (id === "new") redirect("/admin/reviews?saved=1");
  return { message: "Review saved." };
}

export async function moderateReview(fd: FormData) {
  const s = await staff(); if (!s) return;
  const p = idSchema.safeParse({ id: fd.get("id") }); if (!p.success) return;
  const action = String(fd.get("action"));
  const patch =
    action === "approve" ? { status: "approved" } :
    action === "reject" ? { status: "rejected", featured: false } :
    action === "feature" ? { featured: true, status: "approved" } :
    action === "unfeature" ? { featured: false } : null;
  if (action === "delete") await s.db.from("reviews").delete().eq("id", p.data.id);
  else if (patch) await s.db.from("reviews").update(patch).eq("id", p.data.id);
  published();
}

/** Public: signed-in travellers submit a review; it waits for moderation. */
export async function submitReview(_p: FormState, fd: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;
  const user = await getSessionUser();
  if (!user) return { error: "Please sign in to leave a review." };
  if (!rateLimit(`review:${user.id}`, 3, 3_600_000)) return { error: "You've sent several reviews recently. Please try again later." };
  const parsed = reviewSubmitSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;
  const { error } = await (await createClient()).from("reviews").insert({ user_id: user.id, name: v.name, location: v.location ?? null, rating: v.rating, title: v.title ?? null, body: v.body });
  const err = dbError(error, "review submit"); if (err) return err;
  revalidatePath("/admin", "layout");
  return { message: "Thank you! Your review will appear once our team has checked it." };
}

// ---------- ads ----------

const istToIso = (local?: string) => (local ? new Date(`${local}:00+05:30`).toISOString() : null);

export async function saveAd(_p: FormState, fd: FormData): Promise<FormState> {
  const s = await staff(); if (!s) return NOT_CONFIGURED;
  const id = String(fd.get("id") ?? "");
  const parsed = adSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;
  const row = { title: v.title, body: v.body, url: v.url, placement: v.placement, media_id: v.mediaId, starts_at: istToIso(v.startsAt), ends_at: istToIso(v.endsAt), enabled: v.enabled, position: v.position };
  const res = id === "new" ? await s.db.from("ads").insert(row) : await s.db.from("ads").update(row).eq("id", id);
  const err = dbError(res.error, "ad"); if (err) return err;
  published();
  if (id === "new") redirect("/admin/ads?saved=1");
  return { message: "Advertisement saved." };
}

export async function deleteAd(fd: FormData) {
  const s = await staff(); if (!s) return;
  const p = idSchema.safeParse({ id: fd.get("id") }); if (!p.success) return;
  await s.db.from("ads").delete().eq("id", p.data.id);
  published();
  redirect("/admin/ads");
}

// ---------- team ----------

export async function saveTeamMember(_p: FormState, fd: FormData): Promise<FormState> {
  const s = await staff(); if (!s) return NOT_CONFIGURED;
  const id = String(fd.get("id") ?? "");
  const parsed = teamSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;
  const row = { name: v.name, role: v.role, bio: v.bio, photo_media_id: v.photoMediaId, position: v.position, enabled: v.enabled };
  const res = id === "new" ? await s.db.from("team_members").insert(row) : await s.db.from("team_members").update(row).eq("id", id);
  const err = dbError(res.error, "team"); if (err) return err;
  published();
  if (id === "new") redirect("/admin/about?saved=1");
  return { message: "Team member saved." };
}

export async function deleteTeamMember(fd: FormData) {
  const s = await staff(); if (!s) return;
  const p = idSchema.safeParse({ id: fd.get("id") }); if (!p.success) return;
  await s.db.from("team_members").delete().eq("id", p.data.id);
  published();
  redirect("/admin/about");
}

// ---------- contact messages ----------

/** Public contact form. Honeypot + per-IP limit; stored for staff, never shown publicly. */
export async function submitContact(_p: FormState, fd: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;
  if (String(fd.get("website") ?? "")) return { message: "Thank you, we'll be in touch." }; // bot filled the hidden field
  if (!rateLimit(`contact:${await clientIp()}`, 5, 3_600_000)) return { error: "Too many messages from this connection. Please try again later." };
  const parsed = contactSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return invalid(parsed.error);
  const v = parsed.data;
  const { error } = await (await createClient()).from("contact_messages").insert({ name: v.name, email: v.email, phone: v.phone ?? null, subject: v.subject ?? null, message: v.message });
  const err = dbError(error, "contact"); if (err) return { error: "We couldn't send your message. Please email us instead." };
  revalidatePath("/admin", "layout");
  return { message: "Thank you, your message has reached our team. We usually reply within a day." };
}

export async function setMessageStatus(fd: FormData) {
  const s = await staff(); if (!s) return;
  const p = idSchema.safeParse({ id: fd.get("id") }); if (!p.success) return;
  const status = String(fd.get("status"));
  if (status === "delete") { await requireAdmin(); await s.db.from("contact_messages").delete().eq("id", p.data.id); }
  else if (["new", "read", "archived"].includes(status)) await s.db.from("contact_messages").update({ status }).eq("id", p.data.id);
  revalidatePath("/admin", "layout");
}

// ---------- users & cab requests (admin only) ----------

export async function setUserRole(fd: FormData) {
  const admin = await requireAdmin();
  const p = roleSchema.safeParse({ id: fd.get("id"), role: fd.get("role") }); if (!p.success) return;
  if (p.data.id === admin.id && p.data.role !== "admin") return; // never demote yourself and lock everyone out
  await (await createClient()).from("profiles").update({ role: p.data.role }).eq("id", p.data.id);
  revalidatePath("/admin", "layout");
}

export async function updateCabStatus(fd: FormData) {
  await requireAdmin();
  const p = z.object({ id: z.string().uuid(), status: z.enum(["pending", "confirmed", "cancelled", "completed"]) }).safeParse({ id: fd.get("id"), status: fd.get("status") });
  if (!p.success) return;
  await (await createClient()).from("cab_requests").update({ status: p.data.status }).eq("id", p.data.id);
  revalidatePath("/admin", "layout");
}
