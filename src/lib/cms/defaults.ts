import type { HomeSection, SiteSettings } from "./types";

/*
 * Starting content. This is the source for the defaults migration
 * (supabase/migrations/*_cms_defaults.sql) and the fallback used only when Supabase is not configured.
 * Media ids are keys of PHOTOS (src/lib/data/photos.ts).
 */
export const DEFAULT_SETTINGS: Omit<SiteSettings, "logo" | "favicon" | "aboutCover"> = {
  siteName: "The Himalayan Roots",
  tagline: "Hidden villages of Uttarakhand",
  description: "Village homestays, treks, Garhwali and Kumaoni culture, and workations in the hidden Himalayan villages of Uttarakhand.",
  colors: {},
  social: {},
  contact: {},
  about: {
    headline: "Slow, respectful travel to the hidden villages of Garhwal and Kumaon.",
    story: "",
    mission: "",
    vision: "",
    coverMediaId: "mist",
  },
  footerNote: "Travel lightly. Carry out what you carry in, ask before photographing people, and spend where it reaches the village.",
};

type DefaultSection = Omit<HomeSection, "id" | "media" | "mediaList" | "position" | "enabled"> & { key: string };

const blank = { eyebrow: "", title: "", accent: "", body: "", ctaLabel: "", ctaUrl: "", cta2Label: "", cta2Url: "", mediaId: null };

export const DEFAULT_SECTIONS: DefaultSection[] = [
  {
    ...blank, key: "hero", type: "hero",
    eyebrow: "Uttarakhand · Garhwal & Kumaon", title: "Find the villages", accent: "the map forgot.",
    body: "Stay with mountain families, walk ancient trails, eat from Garhwali and Kumaoni kitchens, and wake to a view that resets you.",
    ctaLabel: "Explore villages", ctaUrl: "/villages", cta2Label: "Plan my trip", cta2Url: "/trip-planner", mediaId: "hero", data: {},
  },
  {
    ...blank, key: "intro", type: "intro",
    eyebrow: "The Himalayan Roots", title: "We take you to the hamlets where the road ends and the hospitality begins:",
    accent: "slate roofs, woodsmoke, and a kitchen that feeds you like family.",
    data: {
      items: [
        { icon: "flame", title: "Hosted by families", text: "You stay in homes, not hotels, and eat what the household eats." },
        { icon: "footprints", title: "Slow by design", text: "Fewer places, longer stays. Walk the lanes, join the fields, learn the trail names." },
        { icon: "mountain", title: "Rooted in place", text: "Routes shaped around the village, the season and the weather, not a checklist." },
      ],
    },
  },
  {
    ...blank, key: "regions", type: "regions", eyebrow: "Two cultures, one range", title: "Garhwal and Kumaon",
    data: {
      items: [
        { title: "Garhwal", subtitle: "Where the peaks have names and the temples are older.", text: "Chaukhamba, Kedar and the Mandakini valley. Stone-and-slate villages, jhangora millet and festivals that still gather the whole valley.", mediaId: "garhwal", url: "/villages" },
        { title: "Kumaon", subtitle: "Oak forests, carved doors and the Panchachuli skyline.", text: "Aipan art on the floors, bhatt ki churkani on the stove and ridge after ridge of blue forest running to Nanda Devi.", mediaId: "kumaon", url: "/villages" },
      ],
    },
  },
  {
    ...blank, key: "destinations", type: "destinations", eyebrow: "Handpicked", title: "Villages worth", accent: "the detour",
    ctaLabel: "All villages", ctaUrl: "/villages", data: { kind: "villages", limit: 5 },
  },
  { ...blank, key: "ad-middle", type: "ad", data: { placement: "home_middle" } },
  {
    ...blank, key: "mist", type: "banner", title: "In the hills, the mist is", accent: "part of the itinerary.",
    body: "Every season gives you a different mountain: snow in winter, rhododendron in spring, cloud and waterfalls in the monsoon, glass-clear peaks in autumn.",
    mediaId: "mist", data: {},
  },
  {
    ...blank, key: "stay", type: "split", eyebrow: "Stay", title: "Sleep inside", accent: "the architecture.",
    body: "Carved deodar balconies, dry-stone terraces, slate roofs that shrug off the monsoon. A pahadi house is built around its courtyard and its kitchen, and so is a stay in one.",
    ctaLabel: "Browse homestays", ctaUrl: "/homestays",
    data: {
      mediaIds: ["syunsi", "kafal", "badiyakote"],
      items: [{ title: "Wood-fired meals cooked by your hosts" }, { title: "A hosted walk through the village and its fields" }, { title: "Small houses, a handful of guests at a time" }],
    },
  },
  {
    ...blank, key: "treks", type: "listings", eyebrow: "Walk", title: "Trails that start at", accent: "a doorstep",
    ctaLabel: "All treks", ctaUrl: "/trekking", data: { kind: "trekking", limit: 3 },
  },
  {
    ...blank, key: "craft", type: "mosaic", eyebrow: "Taste & craft", title: "Learn it from", accent: "the hands that keep it.",
    body: "Cook jhangora kheer on a clay chulha. Paint Aipan with rice paste. Sit in on a folk-music evening. Every experience is hosted by a family or artisan from the village itself.",
    ctaLabel: "See experiences", ctaUrl: "/experiences", data: { mediaIds: ["cuisine", "kitchen", "aipan"] },
  },
  { ...blank, key: "reviews", type: "reviews", eyebrow: "Travellers", title: "Words from", accent: "the trail", data: { limit: 6 } },
  {
    ...blank, key: "cta", type: "cta", eyebrow: "Begin", title: "Tell us the time you have.", accent: "We'll shape the route.",
    body: "A long weekend or a month. Walking, staying or working remotely with a proper desk and a view.",
    ctaLabel: "Open the trip planner", ctaUrl: "/trip-planner", cta2Label: "Explore workations", cta2Url: "/workation", mediaId: "cta", data: {},
  },
];
