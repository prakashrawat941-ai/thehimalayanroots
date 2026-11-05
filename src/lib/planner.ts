import type { Listing } from "./data/types";

/** The listing fields the planner needs (kept small: it is sent to the browser). */
export type PlannerListing = Pick<Listing, "kind" | "slug" | "title" | "region" | "tags" | "featured" | "price" | "trek" | "location">;
export const toPlannerListing = ({ kind, slug, title, region, tags, featured, price, trek, location }: Listing): PlannerListing => ({ kind, slug, title, region, tags, featured, price, trek, location });

export const INTERESTS = ["Trekking", "Culture", "Food", "Birding", "Craft", "Workation", "Photography", "Spiritual"] as const;
export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export interface PlanInput {
  region: "Garhwal" | "Kumaon" | "Both";
  days: number;
  travellers: number;
  budget: number;
  interests: string[];
  travelMonth: string;
}

export interface ItineraryDay {
  day: number;
  title: string;
  kind: Listing["kind"];
  slug: string;
}

const INTEREST_KIND: Record<string, Listing["kind"][]> = {
  Trekking: ["trekking"],
  Workation: ["workation"],
  Culture: ["experiences", "villages"],
  Food: ["experiences"],
  Craft: ["experiences"],
  Birding: ["experiences", "villages"],
  Photography: ["villages"],
  Spiritual: ["villages"],
};

function score(l: PlannerListing, input: PlanInput): number {
  let s = 0;
  for (const interest of input.interests) {
    if (INTEREST_KIND[interest]?.includes(l.kind)) s += 2;
    if (l.tags.some((t) => t.toLowerCase().includes(interest.toLowerCase()))) s += 3;
  }
  if (l.featured) s += 1;
  return s;
}

/** Deterministic, rule-based itinerary: no external calls, no user text is interpolated into output. */
export function buildItinerary(input: PlanInput, ALL_LISTINGS: PlannerListing[]): ItineraryDay[] {
  const inRegion = (l: PlannerListing) => input.region === "Both" || l.region === input.region;
  const perNightBudget = input.budget / Math.max(1, input.days * input.travellers);

  const pool = ALL_LISTINGS.filter((l) => inRegion(l) && l.kind !== "homestays" && l.kind !== "workation" || (inRegion(l) && input.interests.includes("Workation") && l.kind === "workation"))
    .filter((l) => l.kind === "trekking" ? l.trek!.days <= input.days : true)
    .sort((a, b) => score(b, input) - score(a, input));

  const stays = ALL_LISTINGS.filter((l) => l.kind === "homestays" && inRegion(l) && l.price <= Math.max(perNightBudget, 2000));
  const stay = stays[0] ?? ALL_LISTINGS.find((l) => l.kind === "homestays" && inRegion(l));

  const days: ItineraryDay[] = [];
  const used = new Set<string>();
  for (let d = 1; d <= input.days; d++) {
    const next = pool.find((l) => !used.has(l.slug));
    if (d === 1 && stay) {
      days.push({ day: d, title: `Arrive and settle in at ${stay.title}`, kind: stay.kind, slug: stay.slug });
      continue;
    }
    if (!next) break;
    used.add(next.slug);
    const span = next.kind === "trekking" ? next.trek!.days : 1;
    days.push({ day: d, title: next.title, kind: next.kind, slug: next.slug });
    d += span - 1;
  }
  return days;
}
