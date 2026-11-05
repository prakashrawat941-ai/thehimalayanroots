import type { Metadata } from "next";
import { ListingIndex } from "@/components/ListingIndex";

export const metadata: Metadata = { title: "Treks and camping", description: "Forest trails, alpine meadows and summit sunrises, led by local guides." };

export default function Page() {
  return <ListingIndex kind="trekking" eyebrow="Walk" title="Treks and camping" intro="Forest trails, alpine meadows and summit sunrises, led by local guides." palette="snow" />;
}
