import { notFound } from "next/navigation";
import { deleteSection, saveSection } from "@/app/actions/cms";
import { AdminForm, Area, Check, ConfirmButton, MediaPicker, SectionDataEditor, Text } from "@/components/admin/client";
import { Card, PageHead, Saved } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth";
import { getAdminSections, getLibrary } from "@/lib/cms/admin-data";
import { SECTION_LABEL, SECTION_TYPES, type SectionType } from "@/lib/cms/types";

export const metadata = { title: "Edit section" };

// Which generic fields each section type uses.
const USES: Record<SectionType, { media?: boolean; body?: boolean; cta?: boolean; cta2?: boolean }> = {
  hero: { media: true, body: true, cta: true, cta2: true }, intro: {}, regions: {}, destinations: { cta: true },
  banner: { media: true, body: true }, split: { body: true, cta: true }, listings: { cta: true }, mosaic: { body: true, cta: true },
  reviews: { cta: true }, promo: { media: true, body: true, cta: true }, features: { body: true }, ad: {}, cta: { media: true, body: true, cta: true, cta2: true },
};

export default async function EditSection({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ type?: string; saved?: string }> }) {
  await requireStaff();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const [sections, library] = await Promise.all([getAdminSections(), getLibrary()]);
  const isNew = id === "new";
  const s = isNew ? null : sections.find((x) => x.id === id);
  if (!isNew && !s) notFound();
  const type = (s?.type ?? SECTION_TYPES.find((t) => t === sp.type) ?? "promo") as SectionType;
  const u = USES[type];

  return (
    <>
      <PageHead eyebrow={`Homepage · ${SECTION_LABEL[type]}`} title={isNew ? "New section" : "Edit section"} />
      <Saved show={sp.saved === "1"} />
      <Card>
        <AdminForm action={saveSection} submitLabel={isNew ? "Create section" : "Save & publish"}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="type" value={type} />
          <Check name="enabled" label="Show on homepage" defaultChecked={s?.enabled ?? true} />
          {type !== "ad" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Text label="Eyebrow" name="eyebrow" defaultValue={s?.eyebrow} maxLength={80} hint="Small label above the heading" />
              <span className="hidden sm:block" />
              <Text label="Heading" name="title" defaultValue={s?.title} maxLength={200} />
              <Text label="Heading accent" name="accent" defaultValue={s?.accent} maxLength={120} hint="Shown in italic gold after the heading" />
            </div>
          )}
          {u.body && <Area label="Text" name="body" defaultValue={s?.body} maxLength={2000} />}
          {u.media && <MediaPicker name="mediaId" label={type === "hero" ? "Hero image" : "Background image"} library={library} value={s?.mediaId} hint="Use a wide, high-resolution landscape photo" />}
          {u.cta && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Text label="Button label" name="ctaLabel" defaultValue={s?.ctaLabel} maxLength={60} />
              <Text label="Button link" name="ctaUrl" defaultValue={s?.ctaUrl} placeholder="/villages" />
              {u.cta2 && <><Text label="Second button label" name="cta2Label" defaultValue={s?.cta2Label} maxLength={60} /><Text label="Second button link" name="cta2Url" defaultValue={s?.cta2Url} placeholder="/trip-planner" /></>}
            </div>
          )}
          <SectionDataEditor type={type} initial={s?.data ?? {}} library={library} />
        </AdminForm>
      </Card>
      {!isNew && (
        <form action={deleteSection} className="mt-6"><input type="hidden" name="id" value={id} /><ConfirmButton message="Delete this section from the homepage?">Delete section</ConfirmButton></form>
      )}
    </>
  );
}
