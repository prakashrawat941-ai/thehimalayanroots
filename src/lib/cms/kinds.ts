import type { ListingKind } from "@/lib/data/types";

/** Admin labels per listing kind: [plural title, singular noun]. */
export const KIND_TITLE: Record<ListingKind, [string, string]> = {
  villages: ["Destinations", "destination"],
  homestays: ["Homestays", "homestay"],
  experiences: ["Experiences", "experience"],
  trekking: ["Trekking packages", "trek"],
  workation: ["Workations", "workation"],
};
