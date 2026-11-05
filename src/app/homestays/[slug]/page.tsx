import type { Metadata } from "next";
import { ListingDetail, loadListing } from "@/components/ListingDetail";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const l = await loadListing("homestays", params);
  return { title: l.title, description: l.tagline };
}

export default function Page({ params }: Props) {
  return <ListingDetail kind="homestays" params={params} />;
}
