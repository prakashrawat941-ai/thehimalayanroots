import type { Metadata } from "next";
import { ListingIndex } from "@/components/ListingIndex";

export const metadata: Metadata = { title: "Village homestays", description: "Family-run stone houses, carved wooden courtyards and kitchens that cook on the chulha." };

export default function Page() {
  return <ListingIndex kind="homestays" eyebrow="Stay" title="Village homestays" intro="Family-run stone houses, carved wooden courtyards and kitchens that cook on the chulha." palette="pine" />;
}
