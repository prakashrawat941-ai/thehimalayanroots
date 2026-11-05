import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteAd, saveAd } from "@/app/actions/cms";
import { AdminForm, Area, Check, ConfirmButton, MediaPicker, Select, Text } from "@/components/admin/client";
import { Card, PageHead } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth";
import { adminDb, getLibrary } from "@/lib/cms/admin-data";
import { AD_PLACEMENTS } from "@/lib/cms/types";

export const metadata = { title: "Edit advertisement" };

interface Row { title: string; body: string; url: string; placement: string; media_id: string | null; starts_at: string | null; ends_at: string | null; enabled: boolean; position: number }

/** ISO → value for <input type="datetime-local"> in IST. */
const toLocal = (iso: string | null) => (iso ? new Date(Date.parse(iso) + 5.5 * 3_600_000).toISOString().slice(0, 16) : "");

export default async function EditAd({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;
  const isNew = id === "new";
  const [res, library] = await Promise.all([
    isNew ? Promise.resolve({ data: null }) : (await adminDb()).from("ads").select("title, body, url, placement, media_id, starts_at, ends_at, enabled, position").eq("id", id).maybeSingle(),
    getLibrary(),
  ]);
  const a = res.data as Row | null;
  if (!isNew && !a) notFound();
  return (
    <>
      <p className="mb-2 text-sm"><Link href="/admin/ads" className="text-forest-700 underline">← Advertisements</Link></p>
      <PageHead eyebrow="Marketing" title={isNew ? "New advertisement" : a!.title} />
      <Card>
        <AdminForm action={saveAd} submitLabel={isNew ? "Create" : "Save"}>
          <input type="hidden" name="id" value={id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Text label="Title" name="title" defaultValue={a?.title} required maxLength={160} />
            <Select label="Placement" name="placement" defaultValue={a?.placement ?? "home_middle"} options={AD_PLACEMENTS.map((p) => [p, p.replace("_", " ")] as [string, string])} />
            <Area label="Short text" name="body" defaultValue={a?.body} rows={2} maxLength={300} className="sm:col-span-2" />
            <Text label="Destination URL" name="url" defaultValue={a?.url} required placeholder="https://partner.example or /homestays" className="sm:col-span-2" />
            <Text label="Start (IST, optional)" name="startsAt" type="datetime-local" defaultValue={toLocal(a?.starts_at ?? null)} />
            <Text label="End (IST, optional)" name="endsAt" type="datetime-local" defaultValue={toLocal(a?.ends_at ?? null)} />
            <Text label="Order" name="position" type="number" min={0} defaultValue={a?.position ?? 0} />
          </div>
          <MediaPicker name="mediaId" label="Advertisement image" library={library} value={a?.media_id} hint="Wide images (about 3:1) work best" />
          <Check name="enabled" label="Enabled" defaultChecked={a?.enabled ?? true} />
        </AdminForm>
      </Card>
      {!isNew && <form action={deleteAd} className="mt-6"><input type="hidden" name="id" value={id} /><ConfirmButton>Delete advertisement</ConfirmButton></form>}
    </>
  );
}
