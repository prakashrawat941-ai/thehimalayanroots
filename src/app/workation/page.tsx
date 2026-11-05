import type { Metadata } from "next";
import { ListingIndex } from "@/components/ListingIndex";

export const metadata: Metadata = { title: "Workations in the hills", description: "Desks, dependable connectivity and mornings that begin with mountains." };

export default function Page() {
  return <ListingIndex kind="workation" eyebrow="Work" title="Workations in the hills" intro="Desks, dependable connectivity and mornings that begin with mountains." palette="meadow" />;
}
