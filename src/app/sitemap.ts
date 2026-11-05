import type { MetadataRoute } from "next";
import { getListings } from "@/lib/cms/queries";
import { siteUrl } from "@/lib/supabase/config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = ["", "/villages", "/homestays", "/experiences", "/trekking", "/workation", "/trip-planner", "/cab", "/about", "/contact", "/reviews", "/credits"].map((p) => ({ url: `${siteUrl}${p}` }));
  return [...pages, ...(await getListings()).map((l) => ({ url: `${siteUrl}/${l.kind}/${l.slug}` }))];
}
