import { Landscape } from "./Landscape";
import type { Listing } from "@/lib/data/types";

export function PageHero({ eyebrow, title, intro, seed, palette = "pine" }: { eyebrow: string; title: string; intro?: string; seed: string; palette?: Listing["palette"] }) {
  return (
    <section className="grain relative isolate overflow-hidden bg-forest-950 pb-20 pt-40">
      <Landscape seed={seed} palette={palette} className="absolute inset-0 -z-10 h-full w-full" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-forest-950/90 via-forest-950/50 to-forest-950/40" />
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <p className="text-xs uppercase tracking-[0.35em] text-saffron">{eyebrow}</p>
        <h1 className="mt-4 max-w-3xl text-5xl font-medium text-ivory-50 sm:text-6xl">{title}</h1>
        {intro && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ivory-100/90">{intro}</p>}
      </div>
    </section>
  );
}
