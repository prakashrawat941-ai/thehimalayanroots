import type { Metadata } from "next";
import { ListingIndex } from "@/components/ListingIndex";

export const metadata: Metadata = { title: "Hidden villages of Uttarakhand", description: "Terraced hamlets, deodar forests and frontier settlements, each with a living culture of its own." };

export default function Page() {
  return <ListingIndex kind="villages" eyebrow="Explore" title="Hidden villages of Uttarakhand" intro="Terraced hamlets, deodar forests and frontier settlements, each with a living culture of its own." palette="dawn" />;
}
