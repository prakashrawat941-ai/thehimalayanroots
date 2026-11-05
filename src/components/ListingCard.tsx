import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { Landscape } from "./Landscape";
import { formatPrice } from "@/lib/format";
import { KIND_LABEL, type Listing } from "@/lib/data/types";

export function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link
      href={`/${listing.kind}/${listing.slug}`}
      className="group block overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-forest-900/5 transition duration-500 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {listing.image ? (
          <Image src={listing.image} alt={listing.title} fill sizes="(min-width:1024px) 33vw, 100vw" className="object-cover transition duration-700 group-hover:scale-105" />
        ) : (
          <Landscape seed={listing.slug} palette={listing.palette} className="h-full w-full transition duration-700 group-hover:scale-105" />
        )}
        <span className="absolute left-3 top-3 rounded-full bg-forest-950/70 px-3 py-1 text-xs tracking-wide text-ivory-50 backdrop-blur">
          {KIND_LABEL[listing.kind]}
        </span>
      </div>
      <div className="p-5">
        <p className="flex items-center gap-1 text-xs text-forest-600"><MapPin size={13} /> {listing.location}</p>
        <h3 className="mt-1 font-display text-2xl font-semibold text-forest-900">{listing.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-forest-800/75">{listing.tagline}</p>
        <p className="mt-4 text-sm font-medium text-clay">{formatPrice(listing)}</p>
      </div>
    </Link>
  );
}
