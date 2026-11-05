import Link from "next/link";
import { ArrowDown, ArrowUp, Eye, EyeOff } from "lucide-react";
import { moveSection, toggleSection } from "@/app/actions/cms";
import { PageHead, Pill } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth";
import { getAdminSections } from "@/lib/cms/admin-data";
import { SECTION_LABEL, SECTION_TYPES } from "@/lib/cms/types";

export const metadata = { title: "Homepage" };

export default async function HomeSectionsAdmin() {
  await requireStaff();
  const sections = await getAdminSections();
  return (
    <>
      <PageHead eyebrow="Content" title="Homepage sections">Sections appear on the homepage in this order. Hidden sections stay saved but aren&apos;t shown.</PageHead>
      <ol className="space-y-2">
        {sections.map((s, i) => (
          <li key={s.id} className={`flex flex-wrap items-center gap-3 rounded-xl bg-white p-3 shadow-sm ring-1 ring-forest-900/5 ${s.enabled ? "" : "opacity-60"}`}>
            <span className="w-6 text-center text-sm text-forest-700">{i + 1}</span>
            <Link href={`/admin/home/${s.id}`} className="min-w-0 flex-1">
              <p className="truncate font-medium text-forest-900 hover:underline">{[s.title, s.accent].filter(Boolean).join(" ") || SECTION_LABEL[s.type]}</p>
              <p className="text-xs text-forest-700">{SECTION_LABEL[s.type]}</p>
            </Link>
            {!s.enabled && <Pill>hidden</Pill>}
            <form action={moveSection}><input type="hidden" name="id" value={s.id} /><input type="hidden" name="dir" value="up" /><button disabled={i === 0} aria-label="Move up" className="rounded p-2 hover:bg-ivory-200 disabled:opacity-30"><ArrowUp size={16} /></button></form>
            <form action={moveSection}><input type="hidden" name="id" value={s.id} /><input type="hidden" name="dir" value="down" /><button disabled={i === sections.length - 1} aria-label="Move down" className="rounded p-2 hover:bg-ivory-200 disabled:opacity-30"><ArrowDown size={16} /></button></form>
            <form action={toggleSection}><input type="hidden" name="id" value={s.id} /><input type="hidden" name="enabled" value={String(!s.enabled)} /><button aria-label={s.enabled ? "Hide section" : "Show section"} className="rounded p-2 hover:bg-ivory-200">{s.enabled ? <Eye size={16} /> : <EyeOff size={16} />}</button></form>
          </li>
        ))}
        {!sections.length && <li className="rounded-xl bg-white p-8 text-center text-sm text-forest-800/60">No sections. Run the CMS defaults migration, or add one below.</li>}
      </ol>
      <form action="/admin/home/new" className="mt-8 flex flex-wrap items-end gap-3 rounded-2xl bg-ivory-100 p-4">
        <label className="text-sm"><span className="mb-1 block text-xs font-medium uppercase tracking-wider text-forest-700">Add a section</span>
          <select name="type" className="rounded-lg border border-ivory-300 bg-white px-3 py-2">{SECTION_TYPES.map((t) => <option key={t} value={t}>{SECTION_LABEL[t]}</option>)}</select>
        </label>
        <button className="rounded-full bg-forest-800 px-5 py-2 text-sm text-ivory-50">Add</button>
      </form>
    </>
  );
}
