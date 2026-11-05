export type ListingKind = "villages" | "homestays" | "experiences" | "trekking" | "workation";

export type Region = "Garhwal" | "Kumaon";

export interface Listing {
  slug: string;
  kind: ListingKind;
  title: string;
  tagline: string;
  region: Region;
  location: string;
  description: string;
  highlights: string[];
  /** Price in INR per person (experiences, treks) or per night (homestays, workation). 0 = free to visit. */
  price: number;
  priceUnit: "person" | "night" | "free";
  /** Optional photo path under /public or an allowed remote host. Falls back to a generated landscape. */
  image?: string;
  /** Seed for the generated landscape and its palette. */
  palette: "dawn" | "pine" | "snow" | "dusk" | "meadow";
  tags: string[];
  featured?: boolean;
  /** Trekking only */
  trek?: { difficulty: "Easy" | "Moderate" | "Challenging"; days: number; maxAltitudeM: number; bestSeason: string };
  /** Workation only */
  workation?: { wifiMbps: number; powerBackup: boolean; deskSetup: boolean };
  /** Homestay only */
  homestay?: { rooms: number; maxGuests: number; meals: string };

  // ----- CMS fields (database-driven; optional for the bundled fallback content) -----
  id?: string;
  status?: "draft" | "published";
  position?: number;
  district?: string;
  state?: string;
  lat?: number;
  lng?: number;
  attractions?: string[];
  facilities?: string[];
  travelInfo?: string;
  bestSeason?: string;
  howToReach?: string;
  cover?: import("@/lib/cms/types").Media | null;
  gallery?: import("@/lib/cms/types").Media[];
}

export const KIND_LABEL: Record<ListingKind, string> = {
  villages: "Village",
  homestays: "Homestay",
  experiences: "Experience",
  trekking: "Trek",
  workation: "Workation",
};
