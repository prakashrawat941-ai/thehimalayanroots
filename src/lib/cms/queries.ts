import "server-only";
import { cache } from "react";
import { createClient as createSupabase } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { ALL_LISTINGS as BUNDLED_LISTINGS } from "@/lib/data/listings";
import { PHOTOS } from "@/lib/data/photos";
import type { Listing, ListingKind } from "@/lib/data/types";
import { DEFAULT_SECTIONS, DEFAULT_SETTINGS } from "./defaults";
import type { Ad, AdPlacement, HomeSection, Media, Review, SectionData, SiteSettings, TeamMember } from "./types";

/** Tag on every cached public read; admin mutations call updateTag(CMS_TAG). */
export const CMS_TAG = "cms";

/**
 * Cookie-less, anon-key client for public content. Its fetches are cached and tagged, so pages stay fast
 * and an admin save shows up on the next request. RLS limits it to published content.
 * Scheduled ads are re-checked at least every 5 minutes.
 */
const pub = () =>
  createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, { ...init, next: { tags: [CMS_TAG], revalidate: 300 } }) },
  });

// ---------- row mappers ----------

export interface MediaRow {
  id: string; path: string | null; url: string; alt: string; caption: string | null; width: number; height: number;
  blur: string | null; credit: string | null; license: string | null; license_url: string | null; source_url: string | null;
}

export const MEDIA_COLUMNS = "id, path, url, alt, caption, width, height, blur, credit, license, license_url, source_url";

export function toMedia(r: MediaRow | null | undefined): Media | null {
  if (!r) return null;
  return {
    id: r.id, src: r.url, width: r.width, height: r.height, alt: r.alt, path: r.path,
    caption: r.caption ?? undefined, blur: r.blur ?? undefined, author: r.credit ?? undefined,
    license: r.license ?? undefined, licenseUrl: r.license_url ?? undefined, source: r.source_url ?? undefined,
  };
}

export interface ListingRow {
  id: string; kind: ListingKind; slug: string; title: string; tagline: string; region: "Garhwal" | "Kumaon"; location: string;
  district: string | null; state: string; lat: number | null; lng: number | null; description: string;
  highlights: string[]; attractions: string[]; facilities: string[]; tags: string[];
  travel_info: string | null; best_season: string | null; how_to_reach: string | null;
  price: number; price_unit: Listing["priceUnit"]; details: Record<string, unknown>; palette: Listing["palette"];
  status: "draft" | "published"; featured: boolean; position: number;
  cover?: MediaRow | null; gallery?: { position: number; media: MediaRow | null }[];
}

export const LISTING_SELECT = `*, cover:media!listings_cover_media_id_fkey(${MEDIA_COLUMNS})`;

export function toListing(r: ListingRow): Listing {
  const cover = toMedia(r.cover);
  const d = r.details ?? {};
  return {
    id: r.id, kind: r.kind, slug: r.slug, title: r.title, tagline: r.tagline, region: r.region, location: r.location,
    description: r.description, highlights: r.highlights, price: r.price, priceUnit: r.price_unit, palette: r.palette,
    tags: r.tags, featured: r.featured, status: r.status, position: r.position,
    district: r.district ?? undefined, state: r.state, lat: r.lat ?? undefined, lng: r.lng ?? undefined,
    attractions: r.attractions, facilities: r.facilities,
    travelInfo: r.travel_info ?? undefined, bestSeason: r.best_season ?? undefined, howToReach: r.how_to_reach ?? undefined,
    image: cover?.src, cover,
    gallery: (r.gallery ?? []).sort((a, b) => a.position - b.position).map((g) => toMedia(g.media)).filter((m): m is Media => Boolean(m)),
    trek: d.trek as Listing["trek"], homestay: d.homestay as Listing["homestay"], workation: d.workation as Listing["workation"],
  };
}

// ---------- bundled fallback (only when Supabase is not configured) ----------

const photoById = (id?: string | null): Media | null => (id && id in PHOTOS ? PHOTOS[id as keyof typeof PHOTOS] : null);
const photoBySrc = (src?: string) => Object.values(PHOTOS).find((p) => p.src === src) ?? null;
const bundled = (): Listing[] => BUNDLED_LISTINGS.map((l) => ({ ...l, status: "published", cover: photoBySrc(l.image), gallery: [] }));

function resolveSection(s: Omit<HomeSection, "media" | "mediaList">, lookup: (id?: string | null) => Media | null): HomeSection {
  const data: SectionData = { ...s.data, items: s.data.items?.map((i) => ({ ...i, media: lookup(i.mediaId) })) };
  return { ...s, data, media: lookup(s.mediaId), mediaList: (s.data.mediaIds ?? []).map(lookup).filter((m): m is Media => Boolean(m)) };
}

const fallbackSections = (): HomeSection[] =>
  DEFAULT_SECTIONS.map(({ key, ...s }, i) => resolveSection({ ...s, id: key, position: i, enabled: true }, photoById));

const fallbackSettings = (): SiteSettings => ({ ...DEFAULT_SETTINGS, logo: null, favicon: null, aboutCover: photoById(DEFAULT_SETTINGS.about.coverMediaId) });

function logError(where: string, error: unknown) {
  console.error(`[cms] ${where}:`, error instanceof Error ? error.message : error);
}

// ---------- public queries ----------

export const getSettings = cache(async (): Promise<SiteSettings> => {
  if (!isSupabaseConfigured) return fallbackSettings();
  const { data, error } = await pub()
    .from("site_settings")
    .select(`*, logo:media!site_settings_logo_media_id_fkey(${MEDIA_COLUMNS}), favicon:media!site_settings_favicon_media_id_fkey(${MEDIA_COLUMNS})`)
    .eq("id", 1).maybeSingle();
  if (error || !data) { logError("settings", error ?? "missing row"); return fallbackSettings(); }
  const about = (data.about ?? {}) as SiteSettings["about"];
  const [aboutCover] = about.coverMediaId ? await getMediaByIds([about.coverMediaId]) : [];
  return {
    siteName: data.site_name, tagline: data.tagline, description: data.description, footerNote: data.footer_note,
    colors: data.colors ?? {}, social: data.social ?? {}, contact: data.contact ?? {}, about,
    logo: toMedia(data.logo), favicon: toMedia(data.favicon), aboutCover: aboutCover ?? null,
  };
});

export async function getMediaByIds(ids: string[]): Promise<Media[]> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length || !isSupabaseConfigured) return [];
  const { data, error } = await pub().from("media").select(MEDIA_COLUMNS).in("id", unique);
  if (error) { logError("media", error); return []; }
  return (data as MediaRow[]).map((r) => toMedia(r)!);
}

interface SectionRow {
  id: string; type: HomeSection["type"]; position: number; enabled: boolean; eyebrow: string; title: string; accent: string; body: string;
  cta_label: string; cta_url: string; cta2_label: string; cta2_url: string; media_id: string | null; data: SectionData;
}

export const toSection = (r: SectionRow): Omit<HomeSection, "media" | "mediaList"> => ({
  id: r.id, type: r.type, position: r.position, enabled: r.enabled, eyebrow: r.eyebrow, title: r.title, accent: r.accent, body: r.body,
  ctaLabel: r.cta_label, ctaUrl: r.cta_url, cta2Label: r.cta2_label, cta2Url: r.cta2_url, mediaId: r.media_id, data: r.data ?? {},
});

export const sectionMediaIds = (s: Pick<HomeSection, "mediaId" | "data">) =>
  [s.mediaId ?? "", ...(s.data.mediaIds ?? []), ...(s.data.items ?? []).map((i) => i.mediaId ?? "")].filter(Boolean);

export const getHomeSections = cache(async (): Promise<HomeSection[]> => {
  if (!isSupabaseConfigured) return fallbackSections();
  const { data, error } = await pub().from("home_sections").select("*").eq("enabled", true).order("position");
  if (error) { logError("home_sections", error); return fallbackSections(); }
  const rows = (data as SectionRow[]).map(toSection);
  const media = new Map((await getMediaByIds(rows.flatMap(sectionMediaIds))).map((m) => [m.id, m]));
  return rows.map((s) => resolveSection(s, (id) => (id ? media.get(id) ?? null : null)));
});

/** Published listings of one kind (or all), featured first, then by position. */
export const getListings = cache(async (kind?: ListingKind): Promise<Listing[]> => {
  if (!isSupabaseConfigured) return bundled().filter((l) => !kind || l.kind === kind);
  let q = pub().from("listings").select(LISTING_SELECT).eq("status", "published");
  if (kind) q = q.eq("kind", kind);
  const { data, error } = await q.order("featured", { ascending: false }).order("position").order("title");
  if (error) { logError("listings", error); return []; }
  return (data as ListingRow[]).map(toListing);
});

export const getListing = cache(async (kind: ListingKind, slug: string): Promise<Listing | undefined> => {
  if (!isSupabaseConfigured) return bundled().find((l) => l.kind === kind && l.slug === slug);
  const { data, error } = await pub()
    .from("listings")
    .select(`${LISTING_SELECT}, gallery:listing_media(position, media(${MEDIA_COLUMNS}))`)
    .eq("kind", kind).eq("slug", slug).eq("status", "published").maybeSingle();
  if (error) logError("listing", error);
  return data ? toListing(data as ListingRow) : undefined;
});

export async function getFeaturedListings(kind: ListingKind, limit: number): Promise<Listing[]> {
  const all = await getListings(kind);
  return all.slice(0, limit);
}

export const getReviews = cache(async (opts: { featuredOnly?: boolean; limit?: number } = {}): Promise<Review[]> => {
  if (!isSupabaseConfigured) return [];
  let q = pub().from("reviews").select(`id, name, location, rating, title, body, featured, created_at, photo:media!reviews_photo_media_id_fkey(${MEDIA_COLUMNS})`).eq("status", "approved");
  if (opts.featuredOnly) q = q.eq("featured", true);
  const { data, error } = await q.order("created_at", { ascending: false }).limit(opts.limit ?? 50);
  if (error) { logError("reviews", error); return []; }
  return (data as unknown as (Omit<Review, "photo" | "createdAt" | "location" | "title"> & { location: string | null; title: string | null; created_at: string; photo: MediaRow | null })[])
    .map((r) => ({ id: r.id, name: r.name, location: r.location ?? undefined, rating: r.rating, title: r.title ?? undefined, body: r.body, featured: r.featured, createdAt: r.created_at, photo: toMedia(r.photo) }));
});

export const getAds = cache(async (placement: AdPlacement): Promise<Ad[]> => {
  if (!isSupabaseConfigured) return [];
  // RLS already hides disabled and out-of-schedule ads from the anon role.
  const { data, error } = await pub().from("ads").select(`id, title, body, url, placement, media:media!ads_media_id_fkey(${MEDIA_COLUMNS})`).eq("placement", placement).order("position").limit(3);
  if (error) { logError("ads", error); return []; }
  return (data as unknown as (Omit<Ad, "media"> & { media: MediaRow | null })[]).map((a) => ({ ...a, media: toMedia(a.media) }));
});

export const getTeam = cache(async (): Promise<TeamMember[]> => {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await pub().from("team_members").select(`id, name, role, bio, photo:media!team_members_photo_media_id_fkey(${MEDIA_COLUMNS})`).eq("enabled", true).order("position");
  if (error) { logError("team", error); return []; }
  return (data as unknown as (Omit<TeamMember, "photo"> & { photo: MediaRow | null })[]).map((t) => ({ ...t, photo: toMedia(t.photo) }));
});

/** Every bundled or library image that appears on the public site, for the credits page. */
export async function getCreditedMedia(): Promise<Media[]> {
  if (!isSupabaseConfigured) return Object.values(PHOTOS);
  const { data, error } = await pub().from("media").select(MEDIA_COLUMNS).not("credit", "is", null).order("created_at");
  if (error) { logError("credits", error); return []; }
  return (data as MediaRow[]).map((r) => toMedia(r)!);
}
