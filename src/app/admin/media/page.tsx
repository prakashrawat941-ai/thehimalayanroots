import Image from "next/image";
import { deleteMedia, updateMedia } from "@/app/actions/cms";
import { AdminForm, ConfirmButton, MediaUploader, Text } from "@/components/admin/client";
import { PageHead } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth";
import { getLibrary } from "@/lib/cms/admin-data";

export const metadata = { title: "Media library" };

export default async function MediaAdmin({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireStaff();
  const { q = "" } = await searchParams;
  const all = await getLibrary();
  const s = q.trim().toLowerCase();
  const media = s ? all.filter((m) => `${m.alt} ${m.caption ?? ""} ${m.author ?? ""}`.toLowerCase().includes(s)) : all;
  return (
    <>
      <PageHead eyebrow="Content" title="Media library">Every image used on the website. Deleting an image removes it everywhere it was used.</PageHead>
      <MediaUploader />
      <form className="my-6"><input name="q" defaultValue={q} placeholder="Search by description, caption or photographer…" className="w-full max-w-md rounded-lg border border-ivory-300 bg-white px-3 py-2 text-sm" /></form>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {media.map((m) => (
          <li key={m.id} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-forest-900/5">
            <div className="relative aspect-[3/2] bg-ivory-200">
              <Image src={m.src} alt={m.alt} fill sizes="(min-width:1280px) 25vw, (min-width:640px) 40vw, 90vw" className="object-cover" placeholder={m.blur ? "blur" : "empty"} blurDataURL={m.blur} />
            </div>
            <details className="p-4">
              <summary className="cursor-pointer text-sm font-medium text-forest-900">{m.alt || "Untitled"} <span className="font-normal text-forest-700">· {m.width}×{m.height}</span></summary>
              <div className="mt-3">
                <AdminForm action={updateMedia} submitLabel="Save details">
                  <input type="hidden" name="id" value={m.id} />
                  <Text label="Alt text" name="alt" defaultValue={m.alt} maxLength={300} hint="Describe the image for screen readers" />
                  <Text label="Caption" name="caption" defaultValue={m.caption} maxLength={300} />
                  <Text label="Photographer / credit" name="credit" defaultValue={m.author} maxLength={200} hint="Credited images appear on /credits" />
                  <Text label="Licence" name="license" defaultValue={m.license} maxLength={60} />
                  <Text label="Licence URL" name="licenseUrl" defaultValue={m.licenseUrl} />
                  <Text label="Source URL" name="sourceUrl" defaultValue={m.source} />
                </AdminForm>
                <form action={deleteMedia} className="mt-3"><input type="hidden" name="id" value={m.id} /><ConfirmButton message="Delete this image? It will disappear wherever it is used.">Delete image</ConfirmButton></form>
              </div>
            </details>
          </li>
        ))}
      </ul>
      {!media.length && <p className="py-12 text-center text-sm text-forest-800/60">No images found.</p>}
    </>
  );
}
