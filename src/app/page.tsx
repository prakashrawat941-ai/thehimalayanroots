import { Section } from "@/components/home/Sections";
import { getHomeSections } from "@/lib/cms/queries";

/** The homepage is entirely database-driven: sections, order, copy and images are managed in /admin/home. */
export default async function HomePage() {
  const sections = await getHomeSections();
  const startsWithHero = sections[0]?.type === "hero" && sections[0].media;
  return (
    <>
      {/* Without a hero, keep the white site header legible. */}
      {!startsWithHero && <div className="h-24 bg-forest-950" />}
      {sections.map((s) => <Section key={s.id} s={s} />)}
    </>
  );
}
