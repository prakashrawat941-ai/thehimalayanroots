import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteListing, saveListing } from "@/app/actions/cms";
import { AdminForm, Area, Check, ConfirmButton, GalleryPicker, MediaPicker, Select, Text } from "@/components/admin/client";
import { Card, PageHead, Saved } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth";
import { getAdminListing, getLibrary } from "@/lib/cms/admin-data";
import { KIND_TITLE } from "@/lib/cms/kinds";
import type { ListingKind } from "@/lib/data/types";

export const metadata = { title: "Edit listing" };

export default async function EditListing({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ kind?: string; saved?: string }> }) {
  await requireStaff();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const isNew = id === "new";
  const [l, library] = await Promise.all([isNew ? null : getAdminListing(id), getLibrary()]);
  if (!isNew && !l) notFound();
  const kind = (l?.kind ?? Object.keys(KIND_TITLE).find((k) => k === sp.kind) ?? "villages") as ListingKind;
  const village = kind === "villages";
  const [title, noun] = KIND_TITLE[kind];

  return (
    <>
      <p className="mb-2 text-sm"><Link href={`/admin/listings?kind=${kind}`} className="text-forest-700 underline">← {title}</Link></p>
      <PageHead eyebrow={title} title={isNew ? `New ${noun}` : l!.title}>
        {l?.status === "published" && <Link href={`/${kind}/${l.slug}`} target="_blank" className="underline">View on website ↗</Link>}
      </PageHead>
      <Saved show={sp.saved === "1"} />
      <AdminForm action={saveListing} submitLabel={isNew ? `Create ${noun}` : "Save"} className="space-y-6">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="kind" value={kind} />
        <Card title="Visibility">
          <div className="grid gap-4 sm:grid-cols-3">
            <Select label="Status" name="status" defaultValue={l?.status ?? "draft"} options={[["draft", "Draft (hidden)"], ["published", "Published"]]} />
            <Text label="Order" name="position" type="number" min={0} defaultValue={l?.position ?? 0} hint="Lower numbers appear first" />
            <div className="flex items-end pb-2"><Check name="featured" label="Featured on homepage" defaultChecked={l?.featured} /></div>
          </div>
        </Card>
        <Card title="Basics">
          <div className="grid gap-4 sm:grid-cols-2">
            <Text label="Name" name="title" defaultValue={l?.title} required maxLength={200} />
            <Text label="URL slug" name="slug" defaultValue={l?.slug} required maxLength={120} hint={`Website address: /${kind}/your-slug`} />
            <Text label="Tagline" name="tagline" defaultValue={l?.tagline} maxLength={300} className="sm:col-span-2" />
            <Area label="Description" name="description" defaultValue={l?.description} rows={7} maxLength={10000} className="sm:col-span-2" hint="Separate paragraphs with a blank line" />
            <Area label="Highlights" name="highlights" defaultValue={l?.highlights.join("\n")} rows={4} hint="One per line" />
            <Text label="Tags" name="tags" defaultValue={l?.tags.join(", ")} hint="Comma-separated; used by search and the trip planner" />
          </div>
        </Card>
        <Card title="Location">
          <div className="grid gap-4 sm:grid-cols-3">
            <Select label="Region" name="region" defaultValue={l?.region ?? "Garhwal"} options={["Garhwal", "Kumaon"]} />
            <Text label="District" name="district" defaultValue={l?.district} maxLength={100} />
            <Text label="State" name="state" defaultValue={l?.state ?? "Uttarakhand"} maxLength={100} />
            <Text label="Location label" name="location" defaultValue={l?.location} maxLength={200} hint="e.g. Ukhimath, Rudraprayag" className="sm:col-span-3" />
            <Text label="Latitude" name="lat" type="number" step="any" min={-90} max={90} defaultValue={l?.lat} />
            <Text label="Longitude" name="lng" type="number" step="any" min={-180} max={180} defaultValue={l?.lng} />
          </div>
        </Card>
        <Card title={village ? "Village details & travel information" : "Details"}>
          <div className="grid gap-4 sm:grid-cols-2">
            {village && <Area label="Attractions" name="attractions" defaultValue={l?.attractions?.join("\n")} rows={4} hint="One per line" />}
            {kind === "homestays" && <Area label="Facilities" name="facilities" defaultValue={l?.facilities?.join("\n")} rows={4} hint="One per line, e.g. Hot water, Wi-Fi" />}
            <Text label="Best season to visit" name="bestSeason" defaultValue={l?.bestSeason} maxLength={300} />
            <Area label="How to reach" name="howToReach" defaultValue={l?.howToReach} rows={3} maxLength={4000} />
            <Area label="Travel information" name="travelInfo" defaultValue={l?.travelInfo} rows={3} maxLength={4000} hint="Permits, mobile network, ATMs, altitude advice…" className="sm:col-span-2" />
          </div>
        </Card>
        {village ? (
          <><input type="hidden" name="priceUnit" value="free" /><input type="hidden" name="price" value="0" /><input type="hidden" name="palette" value={l?.palette ?? "dawn"} /></>
        ) : (
          <Card title="Pricing & facts">
            <div className="grid gap-4 sm:grid-cols-3">
              <Select label="Price unit" name="priceUnit" defaultValue={l?.priceUnit ?? (kind === "homestays" || kind === "workation" ? "night" : "person")} options={[["night", "Per night"], ["person", "Per person"], ["free", "Free"]]} />
              <Text label="Price (₹)" name="price" type="number" min={0} defaultValue={l?.price ?? 0} />
              <Select label="Fallback art" name="palette" defaultValue={l?.palette ?? "pine"} options={["dawn", "pine", "snow", "dusk", "meadow"]} hint="Used only when there is no photo" />
              {kind === "trekking" && <>
                <Select label="Difficulty" name="trekDifficulty" defaultValue={l?.trek?.difficulty ?? ""} options={["", "Easy", "Moderate", "Challenging"]} />
                <Text label="Days" name="trekDays" type="number" min={1} defaultValue={l?.trek?.days} />
                <Text label="Max altitude (m)" name="trekAltitude" type="number" min={0} defaultValue={l?.trek?.maxAltitudeM} />
                <Text label="Trek season" name="trekSeason" defaultValue={l?.trek?.bestSeason} className="sm:col-span-3" />
              </>}
              {kind === "homestays" && <>
                <Text label="Rooms" name="rooms" type="number" min={1} defaultValue={l?.homestay?.rooms} />
                <Text label="Max guests" name="maxGuests" type="number" min={1} defaultValue={l?.homestay?.maxGuests} />
                <Text label="Meals" name="meals" defaultValue={l?.homestay?.meals} />
              </>}
              {kind === "workation" && <>
                <Text label="Wi-Fi (Mbps)" name="wifiMbps" type="number" min={0} defaultValue={l?.workation?.wifiMbps} />
                <div className="flex items-end pb-2"><Check name="powerBackup" label="Power backup" defaultChecked={l?.workation?.powerBackup} /></div>
                <div className="flex items-end pb-2"><Check name="deskSetup" label="Desk setup" defaultChecked={l?.workation?.deskSetup} /></div>
              </>}
            </div>
          </Card>
        )}
        <Card title="Photos">
          <div className="space-y-5">
            <MediaPicker name="coverMediaId" label="Cover photo" library={library} value={l?.cover?.id} />
            <GalleryPicker name="galleryIds" label="Gallery" library={library} value={(l?.gallery ?? []).map((m) => m.id)} hint="Shown on the listing page, in this order" />
          </div>
        </Card>
      </AdminForm>
      {!isNew && (
        <form action={deleteListing} className="mt-6">
          <input type="hidden" name="id" value={id} /><input type="hidden" name="kind" value={kind} />
          <ConfirmButton message={`Delete ${l!.title}? Existing bookings keep their record.`}>Delete {noun}</ConfirmButton>
        </form>
      )}
    </>
  );
}
