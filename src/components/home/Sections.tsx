import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight, ArrowUpRight, Camera, Car, Clock, Flame, Footprints, Heart, Home, Leaf, Map, Mountain, Star, Utensils, Wifi,
  type LucideIcon,
} from "lucide-react";
import { Hero } from "@/components/Hero";
import { ParallaxImage } from "@/components/ParallaxImage";
import { Reveal } from "@/components/Reveal";
import { getAds, getFeaturedListings, getListings, getReviews } from "@/lib/cms/queries";
import type { HomeSection, Media } from "@/lib/cms/types";
import { formatPrice } from "@/lib/format";

const ICONS: Record<string, LucideIcon> = { flame: Flame, footprints: Footprints, mountain: Mountain, home: Home, leaf: Leaf, map: Map, star: Star, heart: Heart, wifi: Wifi, car: Car, camera: Camera, utensils: Utensils };
const D = (d: string) => ({ "--d": d }) as React.CSSProperties;

const Eyebrow = ({ children, light = false }: { children: React.ReactNode; light?: boolean }) =>
  children ? <p className={`text-xs font-medium uppercase tracking-[0.35em] ${light ? "text-saffron" : "text-clay"}`}>{children}</p> : null;

/** Heading with the optional italic accent, e.g. "Villages worth *the detour*". */
const Heading = ({ s, light = false, className = "" }: { s: HomeSection; light?: boolean; className?: string }) =>
  s.title || s.accent ? (
    <h2 className={`text-4xl font-medium sm:text-5xl ${light ? "text-ivory-50" : "text-forest-900"} ${className}`}>
      {s.title}{s.title && s.accent && " "}{s.accent && <span className={`italic-serif ${light ? "text-saffron" : "text-clay"}`}>{s.accent}</span>}
    </h2>
  ) : null;

const Caption = ({ photo, className = "" }: { photo: Media; className?: string }) =>
  photo.caption ? <p className={`pointer-events-none absolute z-10 text-[11px] tracking-wide text-ivory-50/85 drop-shadow ${className}`}>{photo.caption}</p> : null;

function Cover({ photo, sizes, className = "" }: { photo: Media; sizes: string; className?: string }) {
  return <Image src={photo.src} alt={photo.alt} fill sizes={sizes} placeholder={photo.blur ? "blur" : "empty"} blurDataURL={photo.blur} className={`object-cover ${className}`} />;
}

function Cta({ href, label, variant = "solid" }: { href: string; label: string; variant?: "solid" | "ghost" | "link" | "linkLight" }) {
  if (!href || !label) return null;
  const external = href.startsWith("https://");
  const cls = {
    solid: "rounded-full bg-saffron px-7 py-3.5 text-sm font-medium text-forest-950 transition hover:bg-ivory-50",
    ghost: "rounded-full border border-ivory-100/60 px-7 py-3.5 text-sm text-ivory-50 backdrop-blur-sm transition hover:bg-ivory-50 hover:text-forest-950",
    link: "inline-flex items-center gap-2 text-sm font-medium text-forest-700 underline-offset-4 hover:underline",
    linkLight: "inline-flex items-center gap-2 text-sm font-medium text-ivory-100 underline-offset-4 hover:text-saffron hover:underline",
  }[variant];
  return (
    <Link href={href} className={cls} {...(external && { target: "_blank", rel: "noopener noreferrer" })}>
      {label}{(variant === "link" || variant === "linkLight") && <ArrowRight size={16} />}
    </Link>
  );
}

const Paragraphs = ({ text, className }: { text: string; className: string }) =>
  text ? <>{text.split(/\n\s*\n/).map((p, i) => <p key={i} className={className}>{p}</p>)}</> : null;

// Rail on phones, grid from lg up.
const rail = "hide-scrollbar mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 lg:mx-auto lg:grid lg:max-w-7xl lg:gap-6 lg:overflow-visible lg:px-8";
const railItem = "w-[78vw] shrink-0 snap-center sm:w-[46vw] lg:w-auto";

// ---------- section renderers ----------

function HeroSection({ s }: { s: HomeSection }) {
  if (!s.media) return null;
  return (
    <Hero photo={s.media}>
      {s.eyebrow && (
        <p className="rise flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.22em] text-ivory-50 [text-shadow:0_1px_12px_rgb(11_31_22/0.8)] sm:text-xs sm:tracking-[0.35em]" style={D("0.1s")}>
          <span aria-hidden className="h-px w-8 bg-saffron" />{s.eyebrow}
        </p>
      )}
      <h1 className="rise mt-5 max-w-4xl text-[2.75rem] font-medium leading-[1.02] text-ivory-50 sm:text-7xl lg:text-[6.5rem]" style={D("0.25s")}>
        {s.title} {s.accent && <span className="italic-serif text-saffron sm:whitespace-nowrap">{s.accent}</span>}
      </h1>
      {s.body && <p className="rise mt-6 max-w-xl text-base leading-relaxed text-ivory-100/90 sm:text-lg" style={D("0.5s")}>{s.body}</p>}
      <div className="rise mt-9 flex flex-wrap gap-3 sm:gap-4" style={D("0.7s")}>
        <Cta href={s.ctaUrl} label={s.ctaLabel} /><Cta href={s.cta2Url} label={s.cta2Label} variant="ghost" />
      </div>
      <div className="mt-12 flex items-end justify-between gap-6">
        <p className="rise hidden text-[11px] tracking-wide text-ivory-100/70 sm:block" style={D("1.1s")}>
          {s.media.caption && <>{s.media.caption} · </>}<Link href="/credits" className="underline underline-offset-2 hover:text-saffron">Photo credits</Link>
        </p>
        <div className="rise hidden items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-ivory-100/70 sm:flex" style={D("1.2s")} aria-hidden>
          Scroll<span className="relative block h-10 w-px overflow-hidden bg-ivory-100/25"><span className="scroll-cue absolute inset-0 bg-saffron" /></span>
        </div>
      </div>
    </Hero>
  );
}

function IntroSection({ s }: { s: HomeSection }) {
  const items = s.data.items ?? [];
  return (
    <section className="mx-auto max-w-5xl px-5 py-24 sm:py-32 lg:px-8">
      <Reveal>
        <Eyebrow>{s.eyebrow}</Eyebrow>
        <p className="mt-6 font-display text-3xl font-medium leading-[1.14] text-forest-900 sm:text-5xl lg:text-[3.4rem]">
          {s.title}{s.accent && <> <span className="italic-serif text-clay">{s.accent}</span></>}
        </p>
        {s.body && <p className="mt-6 max-w-2xl leading-relaxed text-forest-800/85">{s.body}</p>}
      </Reveal>
      {items.length > 0 && (
        <dl className="mt-14 grid gap-8 border-t border-forest-900/10 pt-10 sm:grid-cols-3">
          {items.map((p, i) => { const Icon = ICONS[p.icon ?? ""]; return (
            <Reveal key={i} delay={i * 0.1}>
              {Icon && <Icon className="text-saffron" size={22} strokeWidth={1.5} />}
              <dt className="mt-4 font-display text-2xl font-semibold text-forest-900">{p.title}</dt>
              {p.text && <dd className="mt-2 text-sm leading-relaxed text-forest-800/80">{p.text}</dd>}
            </Reveal>); })}
        </dl>
      )}
    </section>
  );
}

async function RegionsSection({ s }: { s: HomeSection }) {
  const items = (s.data.items ?? []).filter((i) => i.media);
  if (!items.length) return null;
  const villages = await getListings("villages");
  return (
    <section className="mx-auto max-w-7xl px-5 pb-24 sm:pb-32 lg:px-8">
      <Reveal className="mb-10"><Eyebrow>{s.eyebrow}</Eyebrow><Heading s={s} className="mt-3" /></Reveal>
      <div className={`grid gap-5 ${items.length > 1 ? "md:grid-cols-2" : ""}`}>
        {items.map((r, i) => {
          const places = villages.filter((v) => v.region === r.title).slice(0, 4);
          return (
            <Reveal key={i} delay={i * 0.12}>
              <Link href={r.url || "/villages"} className="group relative block overflow-hidden rounded-3xl bg-forest-900">
                <ParallaxImage photo={r.media!} sizes="(min-width:768px) 80vw, 140vw" amount={6} className="aspect-[4/5] sm:aspect-[5/6] md:aspect-[4/5] lg:aspect-[5/6]" imgClassName="transition-transform duration-[1600ms] ease-out group-hover:scale-105" />
                <div aria-hidden className="absolute inset-0 bg-linear-to-t from-forest-950 via-forest-950/60 via-35% to-transparent to-80%" />
                <div className="absolute inset-x-0 bottom-0 p-6 sm:p-9">
                  <p className="text-xs font-medium uppercase tracking-[0.35em] text-saffron">{r.title}</p>
                  {r.subtitle && <h3 className="mt-3 max-w-md font-display text-3xl font-medium leading-tight text-ivory-50 sm:text-4xl">{r.subtitle}</h3>}
                  {r.text && <p className="mt-3 max-w-md text-sm leading-relaxed text-ivory-100/80">{r.text}</p>}
                  <p className="mt-5 flex flex-wrap items-center gap-x-2 text-sm text-ivory-50">
                    {places.map((p, k) => <span key={p.slug}>{p.title}{k < places.length - 1 && <span className="ml-2 text-saffron">·</span>}</span>)}
                    <ArrowUpRight size={16} className="ml-1 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </p>
                </div>
                <Caption photo={r.media!} className="right-5 top-5 hidden sm:block" />
              </Link>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

// Editorial spans cycle: one wide + one narrow row, then rows of three.
const SPANS = [["lg:col-span-7 lg:h-[34rem]", "lg:aspect-auto lg:h-full"], ["lg:col-span-5 lg:h-[34rem]", "lg:aspect-auto lg:h-full"], ["lg:col-span-4", "lg:aspect-[4/5]"], ["lg:col-span-4", "lg:aspect-[4/5]"], ["lg:col-span-4", "lg:aspect-[4/5]"]];

async function DestinationsSection({ s }: { s: HomeSection }) {
  const list = (await getFeaturedListings(s.data.kind ?? "villages", s.data.limit ?? 5)).filter((l) => l.cover);
  if (!list.length) return null;
  return (
    <section className="bg-ivory-100 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div><Eyebrow>{s.eyebrow}</Eyebrow><Heading s={s} className="mt-3" /></div>
          <Cta href={s.ctaUrl} label={s.ctaLabel} variant="link" />
        </Reveal>
      </div>
      <div className={`${rail} lg:grid-cols-12`}>
        {list.map((l, i) => { const [span, aspect] = SPANS[i % SPANS.length]; return (
          <Reveal key={l.slug} delay={(i % 3) * 0.08} className={`${railItem} ${span}`}>
            <Link href={`/${l.kind}/${l.slug}`} className="group relative block h-full overflow-hidden rounded-2xl bg-forest-900">
              <div className={`relative aspect-[4/5] sm:aspect-[4/4.4] ${aspect}`}>
                <Cover photo={l.cover!} sizes="(min-width:1024px) 80vw, 130vw" className="transition-transform duration-[1600ms] ease-out group-hover:scale-105" />
              </div>
              <div aria-hidden className="absolute inset-0 bg-linear-to-t from-forest-950/90 via-forest-950/30 via-45% to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-saffron">{l.region} · {l.location.split(",")[0]}</p>
                <h3 className="mt-2 font-display text-3xl font-medium text-ivory-50 sm:text-4xl">{l.title}</h3>
                <p className="mt-1 line-clamp-2 max-w-sm text-sm text-ivory-100/80">{l.tagline}</p>
              </div>
            </Link>
          </Reveal>); })}
      </div>
    </section>
  );
}

function BannerSection({ s }: { s: HomeSection }) {
  if (!s.media) return null;
  return (
    <section className="relative isolate" aria-label={s.media.alt}>
      <ParallaxImage photo={s.media} sizes="100vw" amount={9} className="h-[78svh] min-h-[480px]" imgClassName="object-[50%_60%]" />
      <div aria-hidden className="absolute inset-0 bg-forest-950/45" />
      <div className="absolute inset-0 flex items-center justify-center px-5 text-center">
        <Reveal>
          <p className="font-display text-4xl font-medium leading-tight text-ivory-50 sm:text-6xl lg:text-7xl">
            {s.title}{s.accent && <> <span className="italic-serif text-saffron">{s.accent}</span></>}
          </p>
          {s.body && <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-ivory-100/85 sm:text-base">{s.body}</p>}
        </Reveal>
      </div>
      <Caption photo={s.media} className="bottom-4 left-5 sm:left-8" />
    </section>
  );
}

function SplitSection({ s }: { s: HomeSection }) {
  const [a, b, c] = s.mediaList;
  const sizes = ["(min-width:1024px) 80vw, 170vw", "(min-width:1024px) 55vw, 110vw", "(min-width:1024px) 80vw, 160vw"];
  const frame = (m: Media, i: number, cls: string, img = "") => (
    <div className="relative h-full">
      <ParallaxImage photo={m} sizes={sizes[i]} amount={5} className={`${cls} rounded-2xl sm:rounded-3xl`} imgClassName={img} />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 rounded-b-3xl bg-linear-to-t from-forest-950/60 to-transparent" />
      <Caption photo={m} className="bottom-3 left-3 max-w-[85%]" />
    </div>
  );
  return (
    <section className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-24 sm:py-32 lg:grid-cols-12 lg:gap-10 lg:px-8">
      <Reveal className="lg:col-span-5">
        <Eyebrow>{s.eyebrow}</Eyebrow>
        <h2 className="mt-3 text-4xl font-medium leading-[1.05] text-forest-900 sm:text-5xl">{s.title} {s.accent && <span className="italic-serif text-clay">{s.accent}</span>}</h2>
        {s.body && <p className="mt-6 leading-relaxed text-forest-800/85">{s.body}</p>}
        {!!s.data.items?.length && (
          <ul className="mt-7 space-y-3 text-sm text-forest-900">
            {s.data.items.map((t, i) => <li key={i} className="flex items-start gap-3 border-b border-forest-900/10 pb-3"><span className="mt-2 h-1 w-6 shrink-0 bg-saffron" />{t.title}</li>)}
          </ul>
        )}
        {s.ctaUrl && s.ctaLabel && (
          <Link href={s.ctaUrl} className="mt-9 inline-flex items-center gap-2 rounded-full bg-forest-900 px-7 py-3.5 text-sm font-medium text-ivory-50 transition hover:bg-forest-700">{s.ctaLabel} <ArrowRight size={16} /></Link>
        )}
      </Reveal>
      {a && (
        <div className={`grid gap-3 sm:gap-5 lg:col-span-7 ${b ? "grid-cols-2" : ""}`}>
          <Reveal className={b ? "row-span-2" : ""}>{frame(a, 0, b ? "h-full min-h-[320px]" : "aspect-[4/3]", "object-[30%_50%]")}</Reveal>
          {b && <Reveal delay={0.1}>{frame(b, 1, "aspect-[4/5]")}</Reveal>}
          {c && <Reveal delay={0.2}>{frame(c, 2, "aspect-[4/5]", "object-[18%_50%]")}</Reveal>}
        </div>
      )}
    </section>
  );
}

async function ListingsSection({ s }: { s: HomeSection }) {
  const list = await getFeaturedListings(s.data.kind ?? "trekking", s.data.limit ?? 3);
  if (!list.length) return null;
  return (
    <section className="grain relative isolate overflow-hidden bg-forest-950 py-24 text-ivory-50 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div><Eyebrow light>{s.eyebrow}</Eyebrow><Heading s={s} light className="mt-3" /></div>
          <Cta href={s.ctaUrl} label={s.ctaLabel} variant="linkLight" />
        </Reveal>
      </div>
      <div className={`${rail} lg:grid-cols-3`}>
        {list.map((l, i) => (
          <Reveal key={l.slug} delay={i * 0.1} className={railItem}>
            <Link href={`/${l.kind}/${l.slug}`} className="group block">
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-forest-900">
                {l.cover && <Cover photo={l.cover} sizes="(min-width:1024px) 55vw, 130vw" className="transition-transform duration-[1600ms] ease-out group-hover:scale-105" />}
                <div aria-hidden className="absolute inset-0 bg-linear-to-t from-forest-950/70 to-transparent to-45%" />
                {l.trek && <span className="absolute left-4 top-4 rounded-full bg-forest-950/70 px-3 py-1 text-xs tracking-wide backdrop-blur">{l.trek.difficulty}</span>}
              </div>
              <h3 className="mt-5 font-display text-3xl font-medium">{l.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-ivory-200/75">{l.tagline}</p>
              <p className="mt-3 flex items-center gap-4 text-xs text-ivory-100/80">
                {l.trek && <><span className="flex items-center gap-1.5"><Clock size={13} className="text-saffron" /> {l.trek.days} days</span>
                  <span className="flex items-center gap-1.5"><Mountain size={13} className="text-saffron" /> {l.trek.maxAltitudeM.toLocaleString("en-IN")} m</span></>}
                <span className="ml-auto font-medium text-saffron">{formatPrice(l)}</span>
              </p>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function MosaicSection({ s }: { s: HomeSection }) {
  const [a, b, c] = s.mediaList;
  return (
    <section className="mx-auto max-w-7xl px-5 py-24 sm:py-32 lg:px-8">
      <Reveal className="grid items-end gap-6 lg:grid-cols-2">
        <div><Eyebrow>{s.eyebrow}</Eyebrow><Heading s={s} className="mt-3" /></div>
        <div>{s.body && <p className="leading-relaxed text-forest-800/85">{s.body}</p>}<div className="mt-4"><Cta href={s.ctaUrl} label={s.ctaLabel} variant="link" /></div></div>
      </Reveal>
      {a && (
        <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-12">
          <Reveal className="col-span-2 lg:col-span-6">
            <div className="relative aspect-[3/2] overflow-hidden rounded-2xl sm:rounded-3xl"><Cover photo={a} sizes="(min-width:1024px) 50vw, 100vw" /><div aria-hidden className="absolute inset-x-0 bottom-0 h-1/4 bg-linear-to-t from-forest-950/60 to-transparent" /><Caption photo={a} className="bottom-3 left-4" /></div>
          </Reveal>
          {[b, c].map((m, i) => m && (
            <Reveal key={m.id} delay={0.1 * (i + 1)} className="lg:col-span-3">
              <div className="relative aspect-[3/4] overflow-hidden rounded-2xl sm:rounded-3xl lg:aspect-auto lg:h-full"><Cover photo={m} sizes="(min-width:1024px) 25vw, 50vw" /><div aria-hidden className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-forest-950/70 to-transparent" /><Caption photo={m} className="bottom-3 left-3 max-w-[85%]" /></div>
            </Reveal>
          ))}
        </div>
      )}
    </section>
  );
}

async function ReviewsSection({ s }: { s: HomeSection }) {
  const reviews = await getReviews({ featuredOnly: true, limit: s.data.limit ?? 6 });
  if (!reviews.length) return null; // no fake testimonials: the section only appears once real reviews are featured
  return (
    <section className="bg-ivory-100 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div><Eyebrow>{s.eyebrow}</Eyebrow><Heading s={s} className="mt-3" /></div>
          <Cta href={s.ctaUrl || "/reviews"} label={s.ctaLabel || "All reviews"} variant="link" />
        </Reveal>
      </div>
      <div className={`${rail} lg:grid-cols-3`}>
        {reviews.map((r, i) => (
          <Reveal key={r.id} delay={(i % 3) * 0.08} className={railItem}>
            <figure className="flex h-full flex-col rounded-2xl bg-white p-6 shadow-sm ring-1 ring-forest-900/5">
              <span className="flex text-saffron" aria-label={`${r.rating} out of 5 stars`}>{Array.from({ length: 5 }, (_, k) => <Star key={k} size={15} className={k < r.rating ? "fill-saffron" : "opacity-25"} />)}</span>
              {r.title && <p className="mt-4 font-display text-2xl text-forest-900">{r.title}</p>}
              <blockquote className="mt-2 flex-1 text-sm leading-relaxed text-forest-800/85">“{r.body}”</blockquote>
              <figcaption className="mt-5 flex items-center gap-3 text-sm">
                {r.photo && <span className="relative h-10 w-10 overflow-hidden rounded-full"><Cover photo={r.photo} sizes="40px" /></span>}
                <span><span className="block font-medium text-forest-900">{r.name}</span>{r.location && <span className="text-xs text-forest-700">{r.location}</span>}</span>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function PromoSection({ s }: { s: HomeSection }) {
  if (!s.title && !s.media) return null;
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
      <Reveal>
        <div className="relative isolate grid overflow-hidden rounded-3xl bg-forest-900 md:grid-cols-2">
          {s.media && <div className="relative min-h-64"><Cover photo={s.media} sizes="(min-width:768px) 50vw, 100vw" /></div>}
          <div className="p-8 sm:p-12">
            <Eyebrow light>{s.eyebrow}</Eyebrow>
            <Heading s={s} light className="mt-3" />
            <Paragraphs text={s.body} className="mt-4 text-sm leading-relaxed text-ivory-100/85" />
            <div className="mt-7"><Cta href={s.ctaUrl} label={s.ctaLabel} /></div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function FeaturesSection({ s }: { s: HomeSection }) {
  const items = s.data.items ?? [];
  if (!items.length) return null;
  return (
    <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
      <Reveal><Eyebrow>{s.eyebrow}</Eyebrow><Heading s={s} className="mt-3" />{s.body && <p className="mt-4 max-w-2xl text-forest-800/85">{s.body}</p>}</Reveal>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((it, i) => { const Icon = ICONS[it.icon ?? ""]; const inner = (
          <>
            {Icon && <Icon className="text-saffron" size={26} strokeWidth={1.5} />}
            <h3 className="mt-5 font-display text-2xl font-semibold">{it.title}</h3>
            {it.text && <p className="mt-2 text-sm leading-relaxed opacity-75">{it.text}</p>}
          </>);
          const cls = "block h-full rounded-2xl bg-ivory-100 p-7 transition hover:-translate-y-1 hover:bg-forest-800 hover:text-ivory-50";
          return <Reveal key={i} delay={i * 0.08}>{it.url ? <Link href={it.url} className={cls}>{inner}</Link> : <div className={cls}>{inner}</div>}</Reveal>; })}
      </div>
    </section>
  );
}

export async function AdSlot({ placement, className = "" }: { placement: Parameters<typeof getAds>[0]; className?: string }) {
  const ads = await getAds(placement);
  if (!ads.length) return null;
  return (
    <aside aria-label="Advertisement" className={className}>
      {ads.map((a) => (
        <a key={a.id} href={a.url} {...(a.url.startsWith("https://") && { target: "_blank", rel: "noopener noreferrer sponsored" })}
          className="group relative mb-3 flex min-h-32 items-end overflow-hidden rounded-2xl bg-forest-900 p-5 text-ivory-50 last:mb-0">
          {a.media && <Cover photo={a.media} sizes="(min-width:1024px) 60vw, 100vw" className="opacity-70 transition duration-700 group-hover:scale-105" />}
          <span aria-hidden className="absolute inset-0 bg-linear-to-t from-forest-950/80 to-transparent" />
          <span className="relative">
            <span className="block text-[10px] uppercase tracking-[0.3em] text-saffron">Sponsored</span>
            <span className="block font-display text-2xl">{a.title}</span>
            {a.body && <span className="block text-sm text-ivory-100/80">{a.body}</span>}
          </span>
        </a>
      ))}
    </aside>
  );
}

function CtaSection({ s }: { s: HomeSection }) {
  return (
    <section className="relative isolate overflow-hidden bg-forest-950 text-center">
      {s.media && <div className="absolute inset-0 -z-10"><ParallaxImage photo={s.media} sizes="100vw" amount={8} className="h-full" /></div>}
      <div aria-hidden className="absolute inset-0 -z-10 bg-forest-950/70" />
      <div className="grain relative px-5 py-28 sm:py-40">
        <Reveal>
          <Eyebrow light>{s.eyebrow}</Eyebrow>
          <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-medium leading-[1.05] text-ivory-50 sm:text-6xl">{s.title} {s.accent && <span className="italic-serif text-saffron">{s.accent}</span>}</h2>
          {s.body && <p className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-ivory-100/80 sm:text-base">{s.body}</p>}
          <div className="mt-9 flex flex-wrap justify-center gap-3 sm:gap-4"><Cta href={s.ctaUrl} label={s.ctaLabel} /><Cta href={s.cta2Url} label={s.cta2Label} variant="ghost" /></div>
        </Reveal>
      </div>
    </section>
  );
}

/** Renders one database-driven homepage section. Sections with nothing to show render nothing. */
export function Section({ s }: { s: HomeSection }) {
  switch (s.type) {
    case "hero": return <HeroSection s={s} />;
    case "intro": return <IntroSection s={s} />;
    case "regions": return <RegionsSection s={s} />;
    case "destinations": return <DestinationsSection s={s} />;
    case "banner": return <BannerSection s={s} />;
    case "split": return <SplitSection s={s} />;
    case "listings": return <ListingsSection s={s} />;
    case "mosaic": return <MosaicSection s={s} />;
    case "reviews": return <ReviewsSection s={s} />;
    case "promo": return <PromoSection s={s} />;
    case "features": return <FeaturesSection s={s} />;
    case "ad": return <AdSlot placement={s.data.placement ?? "home_middle"} className="mx-auto max-w-7xl px-5 py-10 lg:px-8" />;
    case "cta": return <CtaSection s={s} />;
  }
}

