import { z } from "zod";

export const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your name").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(254),
  password: z.string().min(10, "Use at least 10 characters").max(128),
});

export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(254),
  password: z.string().min(1, "Enter your password").max(128),
});

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date");

export const bookingSchema = z
  .object({
    kind: z.enum(["homestays", "experiences", "trekking", "workation"]),
    slug: z.string().min(1).max(120),
    startDate: isoDate,
    endDate: isoDate,
    guests: z.coerce.number().int().min(1, "At least 1 guest").max(30, "Contact us for groups over 30"),
    notes: z.string().trim().max(1000).optional().default(""),
  })
  .refine((v) => v.endDate >= v.startDate, { message: "End date must be on or after start date", path: ["endDate"] });

export const tripPlanSchema = z.object({
  region: z.enum(["Garhwal", "Kumaon", "Both"]),
  travelMonth: z.string().min(1).max(20),
  days: z.coerce.number().int().min(1).max(30),
  travellers: z.coerce.number().int().min(1).max(30),
  budget: z.coerce.number().int().min(0).max(10_000_000),
  interests: z.array(z.string().max(40)).max(10),
  notes: z.string().trim().max(1000).optional().default(""),
});

export const bookingStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "confirmed", "cancelled", "completed"]),
});

/** Only allow same-site relative redirects. */
export function safeNext(value: unknown, fallback = "/dashboard"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function nightsBetween(start: string, end: string): number {
  const ms = new Date(`${end}T00:00:00Z`).getTime() - new Date(`${start}T00:00:00Z`).getTime();
  return Math.max(1, Math.round(ms / 86_400_000));
}

// ---------- cab requests ----------

const optText = z.string().trim().max(160).optional();

/** A resolved place as returned by /api/places/details. Coordinates must be inside India. */
export const placeSchema = z.object({
  placeId: z.string().min(10).max(300),
  name: z.string().trim().max(200).optional(),
  formattedAddress: z.string().trim().min(3).max(400),
  lat: z.number().min(6).max(37.5),
  lng: z.number().min(68).max(98),
  locality: optText,
  postOffice: optText,
  tehsil: optText,
  district: optText,
  state: optText,
  postalCode: z.string().trim().max(12).optional(),
  country: optText,
});

const placeField = (msg: string) =>
  z.preprocess((v) => {
    if (typeof v !== "string" || !v) return undefined;
    try { return JSON.parse(v); } catch { return undefined; }
  }, placeSchema.optional().refine((p) => p !== undefined, msg) as z.ZodType<z.infer<typeof placeSchema>>);

export const CAB_VEHICLES = ["hatchback", "sedan", "suv", "tempo"] as const;

export const cabSchema = z.object({
  pickup: placeField("Choose a pickup location"),
  drop: placeField("Choose a drop location"),
  pickupAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Choose a pickup date and time"),
  passengers: z.coerce.number().int().min(1, "At least 1 passenger").max(12, "Contact us for larger groups"),
  vehicle: z.enum(CAB_VEHICLES),
  notes: z.string().trim().max(500).optional().default(""),
});

/** Pickup times are entered in Indian Standard Time. */
export function istToDate(local: string): Date {
  return new Date(`${local}:00+05:30`);
}
