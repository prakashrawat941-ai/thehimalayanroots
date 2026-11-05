import type { Metadata } from "next";
import { ListingIndex } from "@/components/ListingIndex";

export const metadata: Metadata = { title: "Local experiences", description: "Cook, weave, paint and listen with the people who keep mountain traditions alive." };

export default function Page() {
  return <ListingIndex kind="experiences" eyebrow="Do" title="Local experiences" intro="Cook, weave, paint and listen with the people who keep mountain traditions alive." palette="dusk" />;
}
