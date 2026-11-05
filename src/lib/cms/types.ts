import type { ListingKind } from "@/lib/data/types";

/** A media-library image. Bundled photos (photos.ts) have the same shape. */
export interface Media {
  id: string;
  src: string;
  width: number;
  height: number;
  alt: string;
  caption?: string;
  blur?: string;
  author?: string;
  license?: string;
  licenseUrl?: string;
  source?: string;
  path?: string | null;
}

export const COLOR_KEYS = ["forest-950", "forest-900", "forest-800", "forest-700", "ivory-50", "ivory-100", "saffron", "clay"] as const;
export type ColorKey = (typeof COLOR_KEYS)[number];
export const SOCIAL_KEYS = ["instagram", "facebook", "youtube", "x", "linkedin", "whatsapp"] as const;
export type SocialKey = (typeof SOCIAL_KEYS)[number];

export interface Contact { email?: string; phone?: string; whatsapp?: string; address?: string; hours?: string; mapUrl?: string }
export interface About { headline?: string; story?: string; mission?: string; vision?: string; coverMediaId?: string }

export interface SiteSettings {
  siteName: string;
  tagline: string;
  description: string;
  logo: Media | null;
  favicon: Media | null;
  colors: Partial<Record<ColorKey, string>>;
  social: Partial<Record<SocialKey, string>>;
  contact: Contact;
  about: About;
  aboutCover: Media | null;
  footerNote: string;
}

export const SECTION_TYPES = ["hero", "intro", "regions", "destinations", "banner", "split", "listings", "mosaic", "reviews", "promo", "features", "ad", "cta"] as const;
export type SectionType = (typeof SECTION_TYPES)[number];

export const SECTION_LABEL: Record<SectionType, string> = {
  hero: "Hero (full screen)",
  intro: "Introduction + feature points",
  regions: "Region cards",
  destinations: "Featured destinations grid",
  banner: "Full-width image banner",
  split: "Text + photo collage",
  listings: "Listing cards (treks, stays…)",
  mosaic: "Photo mosaic",
  reviews: "Customer reviews",
  promo: "Promotional banner",
  features: "Feature grid",
  ad: "Advertisement slot",
  cta: "Call to action",
};

export interface SectionItem { title: string; subtitle?: string; text?: string; icon?: string; mediaId?: string; url?: string; media?: Media | null }

export const AD_PLACEMENTS = ["home_top", "home_middle", "home_bottom", "listing_sidebar"] as const;
export type AdPlacement = (typeof AD_PLACEMENTS)[number];

export interface SectionData {
  items?: SectionItem[];
  mediaIds?: string[];
  kind?: ListingKind;
  limit?: number;
  placement?: AdPlacement;
}

export interface HomeSection {
  id: string;
  type: SectionType;
  position: number;
  enabled: boolean;
  eyebrow: string;
  title: string;
  accent: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  cta2Label: string;
  cta2Url: string;
  mediaId: string | null;
  media: Media | null;
  mediaList: Media[];
  data: SectionData;
}

export interface Review { id: string; name: string; location?: string; rating: number; title?: string; body: string; photo: Media | null; featured: boolean; createdAt: string }
export interface Ad { id: string; title: string; body: string; url: string; placement: AdPlacement; media: Media | null }
export interface TeamMember { id: string; name: string; role: string; bio: string; photo: Media | null }
