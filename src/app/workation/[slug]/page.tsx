import type { Metadata } from "next";
import { ListingDetail, loadListing } from "@/components/ListingDetail";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const l = await loadListing("workation", params);
  return { title: l.title, description: l.tagline };
}

export default function Page({ params }: Props) {
  return <ListingDetail kind="workation" params={params} />;
}
