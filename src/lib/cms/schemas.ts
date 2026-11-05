import { z } from "zod";
import { AD_PLACEMENTS, COLOR_KEYS, SECTION_TYPES, SOCIAL_KEYS } from "./types";

const text = (max: number) => z.string().trim().max(max);
const optText = (max: number) => text(max).optional().transform((v) => v || undefined);
const uuid = z.string().uuid();
const optUuid = z.union([uuid, z.literal("")]).optional().transform((v) => v || null);

/** Internal path (/villages) or an https link. Rejects javascript:, data: and protocol-relative URLs. */
export const linkSchema = text(1000).refine(
  (v) => v === "" || (v.startsWith("/") && !v.startsWith("//") && !v.includes("\\")) || /^https:\/\/[^\s]+$/i.test(v),
  "Use a site path like /villages or a full https:// link",
);
const requiredLink = linkSchema.refine((v) => v !== "", "Required");

const lines = (maxItems: number, maxLen: number) =>
  z.string().optional().default("").transform((v) => v.split("\n").map((s) => s.trim()).filter(Boolean))
    .pipe(z.array(z.string().max(maxLen, `Each line must be under ${maxLen} characters`)).max(maxItems, `At most ${maxItems} lines`));

const checkbox = z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());
const json = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => { try { return typeof v === "string" && v ? JSON.parse(v) : {}; } catch { return Symbol("invalid"); } }, schema);

// ---------- settings ----------
const hex = z.union([z.literal(""), z.string().regex(/^#[0-9a-f]{6}$/i, "Use a 6-digit hex colour like #102a1d")]);

export const settingsSchema = z.object({
  siteName: text(80).min(2, "Enter the site name"),
  tagline: text(200),
  description: text(300),
  footerNote: text(300),
  logoMediaId: optUuid,
  faviconMediaId: optUuid,
  colors: z.object(Object.fromEntries(COLOR_KEYS.map((k) => [k, hex.optional()])) as Record<(typeof COLOR_KEYS)[number], z.ZodOptional<typeof hex>>),
  social: z.object(Object.fromEntries(SOCIAL_KEYS.map((k) => [k, linkSchema.optional()])) as Record<(typeof SOCIAL_KEYS)[number], z.ZodOptional<typeof linkSchema>>),
  contact: z.object({
    email: z.union([z.literal(""), z.string().trim().email("Enter a valid email").max(254)]).optional(),
    phone: optText(20), whatsapp: optText(20), address: optText(400), hours: optText(160), mapUrl: linkSchema.optional(),
  }),
});

export const aboutSchema = z.object({
  headline: text(200), story: text(8000), mission: text(2000), vision: text(2000), coverMediaId: optUuid,
});

// ---------- homepage sections ----------
const itemSchema = z.object({
  title: text(160).min(1, "Each item needs a title"),
  subtitle: optText(200),
  text: optText(600),
  icon: optText(30),
  mediaId: z.union([uuid, z.literal("")]).optional().transform((v) => v || undefined),
  url: linkSchema.optional().transform((v) => v || undefined),
});

export const sectionDataSchema = z.object({
  items: z.array(itemSchema).max(12).optional(),
  mediaIds: z.array(uuid).max(12).optional(),
  kind: z.enum(["villages", "homestays", "experiences", "trekking", "workation"]).optional(),
  limit: z.coerce.number().int().min(1).max(12).optional(),
  placement: z.enum(AD_PLACEMENTS).optional(),
});

export const sectionSchema = z.object({
  type: z.enum(SECTION_TYPES),
  enabled: checkbox,
  eyebrow: text(80), title: text(200), accent: text(120), body: text(2000),
  ctaLabel: text(60), ctaUrl: linkSchema, cta2Label: text(60), cta2Url: linkSchema,
  mediaId: optUuid,
  data: json(sectionDataSchema),
});

// ---------- listings / destinations ----------
const optNum = (min: number, max: number) => z.preprocess((v) => (v === "" || v == null ? undefined : v), z.coerce.number().min(min).max(max).optional());

export const listingSchema = z.object({
  kind: z.enum(["villages", "homestays", "experiences", "trekking", "workation"]),
  slug: z.string().trim().toLowerCase().max(120).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens"),
  title: text(200).min(2, "Enter a name"),
  tagline: text(300),
  region: z.enum(["Garhwal", "Kumaon"]),
  location: text(200),
  district: optText(100),
  state: text(100).default("Uttarakhand"),
  lat: optNum(-90, 90),
  lng: optNum(-180, 180),
  description: text(10000),
  highlights: lines(30, 300),
  attractions: lines(50, 300),
  facilities: lines(50, 160),
  tags: z.string().optional().default("").transform((v) => v.split(",").map((s) => s.trim()).filter(Boolean)).pipe(z.array(z.string().max(40)).max(20)),
  travelInfo: optText(4000),
  bestSeason: optText(300),
  howToReach: optText(4000),
  price: z.coerce.number().int().min(0).max(10_000_000).default(0),
  priceUnit: z.enum(["person", "night", "free"]),
  palette: z.enum(["dawn", "pine", "snow", "dusk", "meadow"]).default("pine"),
  status: z.enum(["draft", "published"]),
  featured: checkbox,
  position: z.coerce.number().int().min(0).max(100000).default(0),
  coverMediaId: optUuid,
  galleryIds: json(z.array(uuid).max(40)),
  // Kind-specific facts; blank fields are dropped.
  trekDifficulty: z.enum(["", "Easy", "Moderate", "Challenging"]).optional(),
  trekDays: optNum(1, 60), trekAltitude: optNum(0, 9000), trekSeason: optText(120),
  rooms: optNum(1, 100), maxGuests: optNum(1, 200), meals: optText(160),
  wifiMbps: optNum(0, 10000), powerBackup: checkbox, deskSetup: checkbox,
}).refine((v) => v.priceUnit === "free" || v.price > 0, { message: "Set a price, or choose Free", path: ["price"] })
  .refine((v) => (v.lat === undefined) === (v.lng === undefined), { message: "Enter both latitude and longitude", path: ["lat"] });

// ---------- reviews, ads, team, contact, users ----------
export const reviewAdminSchema = z.object({
  name: text(120).min(2, "Enter a name"), location: optText(120), rating: z.coerce.number().int().min(1).max(5),
  title: optText(160), body: text(2000).min(10, "At least 10 characters"),
  status: z.enum(["pending", "approved", "rejected"]), featured: checkbox, photoMediaId: optUuid,
});

export const reviewSubmitSchema = z.object({
  name: text(120).min(2, "Enter your name"), location: optText(120), rating: z.coerce.number().int().min(1, "Choose a rating").max(5),
  title: optText(160), body: text(2000).min(10, "Tell us a little more (10+ characters)"),
});

const optDate = z.preprocess((v) => (v ? v : undefined), z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/).optional());
export const adSchema = z.object({
  title: text(160).min(2, "Enter a title"), body: text(300), url: requiredLink, placement: z.enum(AD_PLACEMENTS),
  mediaId: optUuid, startsAt: optDate, endsAt: optDate, enabled: checkbox, position: z.coerce.number().int().min(0).max(10000).default(0),
}).refine((v) => !v.startsAt || !v.endsAt || v.endsAt > v.startsAt, { message: "End must be after start", path: ["endsAt"] });

export const teamSchema = z.object({
  name: text(120).min(2, "Enter a name"), role: text(120), bio: text(1000), photoMediaId: optUuid,
  position: z.coerce.number().int().min(0).max(10000).default(0), enabled: checkbox,
});

export const contactSchema = z.object({
  name: text(120).min(2, "Enter your name"),
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(254),
  phone: optText(20), subject: optText(160),
  message: text(4000).min(10, "Tell us a little more (10+ characters)"),
});

export const mediaUpdateSchema = z.object({
  id: uuid, alt: text(300), caption: optText(300), credit: optText(200), license: optText(60),
  licenseUrl: linkSchema.optional().transform((v) => v || undefined), sourceUrl: linkSchema.optional().transform((v) => v || undefined),
});

export const idSchema = z.object({ id: uuid });
export const roleSchema = z.object({ id: uuid, role: z.enum(["user", "host", "editor", "admin"]) });
