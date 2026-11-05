import type { Metadata } from "next";
import Image from "next/image";
import { getCreditedMedia } from "@/lib/cms/queries";

export const metadata: Metadata = {
  title: "Photo credits",
  description: "Authors and licences for the photographs of Garhwal and Kumaon used on The Himalayan Roots.",
};

export default async function CreditsPage() {
  const photos = await getCreditedMedia();
  return (
    <>
      <div className="bg-forest-950 px-5 pb-14 pt-36 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-medium uppercase tracking-[0.35em] text-saffron">Photography</p>
          <h1 className="mt-3 text-5xl font-medium text-ivory-50 sm:text-6xl">Photo credits</h1>
          <p className="mt-6 max-w-2xl leading-relaxed text-ivory-100/80">
            The photographs on this site were taken by independent photographers and shared openly on Wikimedia Commons. We are grateful to each of them.
            Images have been resized, and some cropped, for the web. Follow a source link to see the original and its full licence terms.
          </p>
        </div>
      </div>
      <div className="mx-auto max-w-5xl px-5 pb-24 pt-6 lg:px-8">
      <ul className="divide-y divide-forest-900/10">
        {photos.map((p) => (
          <li key={p.id} className="flex gap-4 py-5 sm:gap-6">
            <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg sm:h-24 sm:w-36">
              <Image src={p.src} alt="" fill sizes="144px" placeholder={p.blur ? "blur" : "empty"} blurDataURL={p.blur} className="object-cover" />
            </div>
            <div className="min-w-0 text-sm">
              <p className="font-medium text-forest-900">{p.caption}</p>
              <p className="mt-1 text-forest-800/80">
                By {p.author} ·{" "}
                {p.licenseUrl ? (
                  <a href={p.licenseUrl} rel="noopener noreferrer" className="underline underline-offset-2 hover:text-clay">{p.license}</a>
                ) : (
                  p.license
                )}{" "}
                ·{" "}
                {p.source && <a href={p.source} rel="noopener noreferrer" className="underline underline-offset-2 hover:text-clay">Source</a>}
              </p>
            </div>
          </li>
        ))}
      </ul>
      </div>
    </>
  );
}
