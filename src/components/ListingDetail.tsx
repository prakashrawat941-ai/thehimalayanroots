import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, MapPin, Navigation } from "lucide-react";
import { Landscape } from "./Landscape";
import { BookingForm } from "./BookingForm";
import { AdSlot } from "./home/Sections";
import { getSessionUser } from "@/lib/auth";
import { getListing } from "@/lib/cms/queries";
import { isBookable } from "@/lib/data/listings";
import { formatPrice } from "@/lib/format";
import { KIND_LABEL, type ListingKind } from "@/lib/data/types";

export async function loadListing(kind: ListingKind, params: Promise<{ slug: string }>) {
  const { slug } = await params;
  const listing = await getListing(kind, slug);
  if (!listing) notFound();
  return listing;
}

const Paragraphs = ({ text }: { text?: string }) =>
  text ? <>{text.split(/\n\s*\n/).map((p, i) => <p key={i} className="mt-4 whitespace-pre-line leading-relaxed text-forest-800/85 first:mt-0">{p}</p>)}</> : null;

function List({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <>
      <h2 className="mt-12 text-3xl font-medium text-forest-900">{title}</h2>
      <ul className="mt-5 space-y-3">
        {items.map((h) => <li key={h} className="flex gap-3 text-forest-800"><Check size={18} className="mt-0.5 shrink-0 text-forest-500" />{h}</li>)}
      </ul>
    </>
  );
}

export async function ListingDetail({ kind, params }: { kind: ListingKind; params: Promise<{ slug: string }> }) {
  const listing = await loadListing(kind, params);
  const user = isBookable(kind) ? await getSessionUser() : null;
  const cover = listing.cover;
  const place = [listing.location, listing.district && !listing.location.includes(listing.district) ? listing.district : null].filter(Boolean).join(", ");

  return (
    <>
      <section className="relative isolate h-[60svh] min-h-[420px] overflow-hidden bg-forest-950">
        {cover ? (
          <Image src={cover.src} alt={cover.alt} fill preload sizes="100vw" placeholder={cover.blur ? "blur" : "empty"} blurDataURL={cover.blur} className="object-cover" />
        ) : (
          <Landscape seed={listing.slug} palette={listing.palette} className="absolute inset-0 h-full w-full" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-forest-950 via-forest-950/30 to-forest-950/40" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-7xl px-5 pb-12 lg:px-8">
          <p className="text-xs uppercase tracking-[0.35em] text-saffron">{KIND_LABEL[listing.kind]} · {listing.region}</p>
          <h1 className="mt-3 text-5xl font-medium text-ivory-50 sm:text-7xl">{listing.title}</h1>
          {place && <p className="mt-2 flex items-center gap-1.5 text-ivory-100"><MapPin size={16} /> {place}</p>}
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 lg:grid-cols-[1fr_380px] lg:px-8">
        <article className="min-w-0">
          {listing.tagline && <p className="mb-6 font-display text-3xl leading-snug text-forest-900">{listing.tagline}</p>}
          <Paragraphs text={listing.description} />

          {!!listing.gallery?.length && (
            <div className="hide-scrollbar -mx-5 mt-10 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0">
              {listing.gallery.map((m) => (
                <figure key={m.id} className="relative aspect-[4/3] w-[80vw] shrink-0 snap-center overflow-hidden rounded-2xl bg-ivory-200 sm:w-[45vw] lg:w-auto">
                  <Image src={m.src} alt={m.alt} fill sizes="(min-width:1024px) 25vw, 80vw" placeholder={m.blur ? "blur" : "empty"} blurDataURL={m.blur} className="object-cover" />
                  {m.caption && <figcaption className="absolute inset-x-0 bottom-0 bg-linear-to-t from-forest-950/70 to-transparent p-3 text-xs text-ivory-50">{m.caption}</figcaption>}
                </figure>
              ))}
            </div>
          )}

          <List title="Highlights" items={listing.highlights} />
          <List title="Attractions" items={listing.attractions} />
          <List title="Facilities" items={listing.facilities} />

          <dl className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {listing.bestSeason && <Fact label="Best season" value={listing.bestSeason} />}
            {listing.district && <Fact label="District" value={listing.district} />}
            {listing.state && <Fact label="State" value={listing.state} />}
            {listing.trek && <>
              <Fact label="Difficulty" value={listing.trek.difficulty} />
              <Fact label="Duration" value={`${listing.trek.days} days`} />
              <Fact label="Max altitude" value={`${listing.trek.maxAltitudeM.toLocaleString("en-IN")} m`} />
              {listing.trek.bestSeason && listing.trek.bestSeason !== listing.bestSeason && <Fact label="Trek season" value={listing.trek.bestSeason} />}
            </>}
            {listing.workation && <>
              <Fact label="Wi-Fi" value={`~${listing.workation.wifiMbps} Mbps`} />
              <Fact label="Power backup" value={listing.workation.powerBackup ? "Yes" : "No"} />
              <Fact label="Desk setup" value={listing.workation.deskSetup ? "Yes" : "No"} />
            </>}
            {listing.homestay && <>
              <Fact label="Rooms" value={String(listing.homestay.rooms)} />
              <Fact label="Max guests" value={String(listing.homestay.maxGuests)} />
              <Fact label="Meals" value={listing.homestay.meals} />
            </>}
          </dl>

          {listing.howToReach && <><h2 className="mt-12 text-3xl font-medium text-forest-900">How to reach</h2><div className="mt-4"><Paragraphs text={listing.howToReach} /></div></>}
          {listing.travelInfo && <><h2 className="mt-12 text-3xl font-medium text-forest-900">Good to know</h2><div className="mt-4"><Paragraphs text={listing.travelInfo} /></div></>}
          {listing.lat !== undefined && listing.lng !== undefined && (
            <a href={`https://www.google.com/maps/search/?api=1&query=${listing.lat},${listing.lng}`} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex items-center gap-2 rounded-full border border-forest-800 px-5 py-2.5 text-sm text-forest-800 hover:bg-forest-800 hover:text-ivory-50">
              <Navigation size={15} /> Open in maps
            </a>
          )}
        </article>

        <aside className="h-fit space-y-6 lg:sticky lg:top-8">
          <div className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-forest-900/5">
            <p className="font-display text-3xl text-forest-900">{formatPrice(listing)}</p>
            <div className="mt-6">
              {isBookable(kind) ? (
                <BookingForm listing={listing} signedIn={Boolean(user)} />
              ) : (
                <div className="space-y-4 text-sm text-forest-800">
                  <p>Villages are best experienced with a local host. Find a stay or an experience here.</p>
                  <Link href="/homestays" className="block rounded-full bg-forest-800 px-6 py-3 text-center text-ivory-50">Browse homestays</Link>
                  <Link href="/experiences" className="block rounded-full border border-forest-800 px-6 py-3 text-center text-forest-800">Browse experiences</Link>
                  <Link href="/cab" className="block rounded-full border border-forest-800 px-6 py-3 text-center text-forest-800">Book a cab here</Link>
                </div>
              )}
            </div>
          </div>
          <AdSlot placement="listing_sidebar" />
        </aside>
      </div>
    </>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-ivory-100 p-4">
      <dt className="text-xs uppercase tracking-wider text-forest-600">{label}</dt>
      <dd className="mt-1 font-display text-xl font-semibold text-forest-900">{value}</dd>
    </div>
  );
}
