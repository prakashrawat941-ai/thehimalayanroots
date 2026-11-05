import { PageHero } from "./PageHero";
import { ListingGrid } from "./ListingGrid";
import { getListings } from "@/lib/cms/queries";
import type { Listing, ListingKind } from "@/lib/data/types";

export async function ListingIndex({ kind, eyebrow, title, intro, palette }: { kind: ListingKind; eyebrow: string; title: string; intro: string; palette?: Listing["palette"] }) {
  return (
    <>
      <PageHero eyebrow={eyebrow} title={title} intro={intro} seed={`index-${kind}`} palette={palette} />
      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <ListingGrid listings={await getListings(kind)} />
      </section>
    </>
  );
}
