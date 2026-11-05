import type { Metadata } from "next";
import Image from "next/image";
import { getSettings, getTeam } from "@/lib/cms/queries";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return { title: "Our story", description: s.about.headline || s.description };
}

const Paragraphs = ({ text }: { text?: string }) =>
  text ? <>{text.split(/\n\s*\n/).map((p, i) => <p key={i} className="mt-5 whitespace-pre-line text-lg leading-relaxed text-forest-800/85 first:mt-0">{p}</p>)}</> : null;

export default async function AboutPage() {
  const [s, team] = await Promise.all([getSettings(), getTeam()]);
  const a = s.about;
  return (
    <>
      <section className="relative isolate flex min-h-[60svh] items-end overflow-hidden bg-forest-950">
        {s.aboutCover && <Image src={s.aboutCover.src} alt={s.aboutCover.alt} fill preload sizes="100vw" placeholder={s.aboutCover.blur ? "blur" : "empty"} blurDataURL={s.aboutCover.blur} className="-z-10 object-cover" />}
        <div className="absolute inset-0 -z-10 bg-linear-to-t from-forest-950 via-forest-950/50 to-forest-950/40" />
        <div className="mx-auto w-full max-w-7xl px-5 pb-16 pt-40 lg:px-8">
          <p className="text-xs uppercase tracking-[0.35em] text-saffron">Our story</p>
          <h1 className="mt-4 max-w-4xl text-5xl font-medium leading-[1.05] text-ivory-50 sm:text-7xl">{a.headline || s.siteName}</h1>
        </div>
      </section>
      <div className="mx-auto max-w-3xl px-5 py-20">
        <Paragraphs text={a.story} />
        {!a.story && <p className="text-forest-800/70">Our story is being written. Check back soon.</p>}
      </div>
      {(a.mission || a.vision) && (
        <section className="bg-ivory-100 py-20">
          <div className="mx-auto grid max-w-5xl gap-10 px-5 sm:grid-cols-2 lg:px-8">
            {a.mission && <div><p className="text-xs uppercase tracking-[0.35em] text-clay">Mission</p><p className="mt-4 font-display text-3xl leading-snug text-forest-900">{a.mission}</p></div>}
            {a.vision && <div><p className="text-xs uppercase tracking-[0.35em] text-clay">Vision</p><p className="mt-4 font-display text-3xl leading-snug text-forest-900">{a.vision}</p></div>}
          </div>
        </section>
      )}
      {team.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <h2 className="text-4xl font-medium text-forest-900 sm:text-5xl">The people behind the trips</h2>
          <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((t) => (
              <li key={t.id}>
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-ivory-200">
                  {t.photo && <Image src={t.photo.src} alt={t.photo.alt || t.name} fill sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw" placeholder={t.photo.blur ? "blur" : "empty"} blurDataURL={t.photo.blur} className="object-cover" />}
                </div>
                <p className="mt-4 font-display text-2xl text-forest-900">{t.name}</p>
                {t.role && <p className="text-sm text-clay">{t.role}</p>}
                {t.bio && <p className="mt-2 text-sm leading-relaxed text-forest-800/80">{t.bio}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
