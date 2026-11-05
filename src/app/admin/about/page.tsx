import Image from "next/image";
import Link from "next/link";
import { saveAbout } from "@/app/actions/cms";
import { AdminForm, Area, MediaPicker, Text } from "@/components/admin/client";
import { Card, PageHead, Pill, Saved } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth";
import { adminDb, getLibrary } from "@/lib/cms/admin-data";
import { MEDIA_COLUMNS, toMedia, type MediaRow } from "@/lib/cms/queries";
import type { About } from "@/lib/cms/types";

export const metadata = { title: "Our story & team" };

interface TeamRow { id: string; name: string; role: string; enabled: boolean; position: number; photo: MediaRow | null }

export default async function AboutAdmin({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  await requireStaff();
  const { saved } = await searchParams;
  const db = await adminDb();
  const [{ data: settings }, { data: team }, library] = await Promise.all([
    db.from("site_settings").select("about").eq("id", 1).maybeSingle(),
    db.from("team_members").select(`id, name, role, enabled, position, photo:media!team_members_photo_media_id_fkey(${MEDIA_COLUMNS})`).order("position"),
    getLibrary(),
  ]);
  const a = (settings?.about ?? {}) as About;
  return (
    <>
      <PageHead eyebrow="Content" title="Our story & team">Shown on the public About page (/about).</PageHead>
      <Saved show={saved === "1"} />
      <Card title="Our story">
        <AdminForm action={saveAbout} submitLabel="Save & publish">
          <Text label="Headline" name="headline" defaultValue={a.headline} maxLength={200} />
          <Area label="Our story" name="story" defaultValue={a.story} rows={8} maxLength={8000} hint="Separate paragraphs with a blank line" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Area label="Mission" name="mission" defaultValue={a.mission} rows={4} maxLength={2000} />
            <Area label="Vision" name="vision" defaultValue={a.vision} rows={4} maxLength={2000} />
          </div>
          <MediaPicker name="coverMediaId" label="Cover image" library={library} value={a.coverMediaId} />
        </AdminForm>
      </Card>
      <div className="mb-4 mt-10 flex items-end justify-between">
        <h2 className="font-display text-3xl text-forest-900">Team</h2>
        <Link href="/admin/about/team/new" className="rounded-full bg-forest-800 px-5 py-2 text-sm text-ivory-50">Add team member</Link>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {((team ?? []) as unknown as TeamRow[]).map((t) => { const p = toMedia(t.photo); return (
          <li key={t.id}>
            <Link href={`/admin/about/team/${t.id}`} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-forest-900/5 hover:ring-forest-700/30">
              <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-ivory-200">{p && <Image src={p.src} alt="" fill sizes="56px" className="object-cover" />}</span>
              <span className="min-w-0"><span className="block truncate font-medium text-forest-900">{t.name}</span><span className="block truncate text-xs text-forest-700">{t.role}</span></span>
              {!t.enabled && <span className="ml-auto"><Pill>hidden</Pill></span>}
            </Link>
          </li>); })}
        {!team?.length && <li className="text-sm text-forest-800/60">No team members yet.</li>}
      </ul>
    </>
  );
}
