"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { createContext, useActionState, useContext, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Plus, Trash2, X } from "lucide-react";
import { uploadMedia } from "@/app/actions/cms";
import type { FormState } from "@/app/actions/auth";
import type { Media, SectionData, SectionItem, SectionType } from "@/lib/cms/types";

const Errors = createContext<FormState["fieldErrors"]>(undefined);
export const control = "w-full rounded-lg border border-ivory-300 bg-white px-3 py-2 text-sm text-forest-950 outline-none transition focus:border-forest-600 focus:ring-2 focus:ring-forest-600/20";

/** Server-action form with inline field errors and a status line. */
export function AdminForm({ action, children, submitLabel = "Save", className = "" }: { action: (p: FormState, fd: FormData) => Promise<FormState>; children: ReactNode; submitLabel?: string; className?: string }) {
  const [state, formAction, pending] = useActionState(action, {} as FormState);
  return (
    <form action={formAction} className={`space-y-5 ${className}`} noValidate>
      <Errors.Provider value={state.fieldErrors}>{children}</Errors.Provider>
      <div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center gap-3 border-t border-ivory-200 bg-ivory-50/95 px-1 py-3 backdrop-blur">
        <button disabled={pending} className="inline-flex items-center gap-2 rounded-full bg-forest-800 px-6 py-2.5 text-sm font-medium text-ivory-50 hover:bg-forest-700 disabled:opacity-60">
          {pending && <Loader2 size={14} className="animate-spin" />}{submitLabel}
        </button>
        {state.error && <p role="alert" className="text-sm text-clay">{state.error}</p>}
        {state.message && <p role="status" className="text-sm text-forest-700">{state.message}</p>}
      </div>
    </form>
  );
}

function Wrap({ label, name, hint, children, className = "" }: { label: string; name: string; hint?: string; children: ReactNode; className?: string }) {
  const err = useContext(Errors)?.[name]?.[0];
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-forest-700">{label}</span>
      {children}
      {hint && !err && <span className="mt-1 block text-xs text-forest-800/60">{hint}</span>}
      {err && <span role="alert" className="mt-1 block text-xs text-clay">{err}</span>}
    </label>
  );
}

type Base = { label: string; name: string; hint?: string; className?: string };
export const Text = ({ label, name, hint, className, ...p }: Base & React.InputHTMLAttributes<HTMLInputElement>) => (
  <Wrap label={label} name={name} hint={hint} className={className}><input name={name} {...p} className={control} /></Wrap>
);
export const Area = ({ label, name, hint, className, rows = 4, ...p }: Base & React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <Wrap label={label} name={name} hint={hint} className={className}><textarea name={name} rows={rows} {...p} className={control} /></Wrap>
);
export const Select = ({ label, name, hint, className, options, ...p }: Base & React.SelectHTMLAttributes<HTMLSelectElement> & { options: readonly (string | [string, string])[] }) => (
  <Wrap label={label} name={name} hint={hint} className={className}>
    <select name={name} {...p} className={control}>
      {options.map((o) => { const [v, l] = typeof o === "string" ? [o, o] : o; return <option key={v} value={v}>{l}</option>; })}
    </select>
  </Wrap>
);
export const Check = ({ label, name, defaultChecked }: { label: string; name: string; defaultChecked?: boolean }) => (
  <label className="flex items-center gap-2 text-sm text-forest-900"><input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4 accent-forest-700" />{label}</label>
);

/** Submit button that asks for confirmation first (deletes). */
export function ConfirmButton({ children, message = "Delete this permanently?", className = "" }: { children: ReactNode; message?: string; className?: string }) {
  return (
    <button onClick={(e) => { if (!confirm(message)) e.preventDefault(); }} className={className || "inline-flex items-center gap-1.5 rounded-full border border-clay/40 px-4 py-2 text-sm text-clay hover:bg-clay/10"}>
      {children}
    </button>
  );
}

export function AdminNav({ links }: { links: { href: string; label: string; badge?: number }[] }) {
  const path = usePathname();
  const params = useSearchParams();
  return (
    <nav aria-label="Admin" className="hide-scrollbar flex gap-1 overflow-x-auto lg:flex-col">
      {links.map((l) => {
        const [base, query] = l.href.split("?");
        const kind = query ? new URLSearchParams(query).get("kind") : null;
        const active = base === "/admin" ? path === "/admin" : kind ? path === base && params.get("kind") === kind : path.startsWith(base);
        return (
          <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm ${active ? "bg-forest-800 text-ivory-50" : "text-forest-800 hover:bg-ivory-200"}`}>
            {l.label}
            {!!l.badge && <span className="rounded-full bg-saffron px-2 text-xs font-medium text-forest-950">{l.badge}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

// ---------- media picking ----------

function Thumb({ m, className = "h-20 w-28" }: { m: Media; className?: string }) {
  return (
    <span className={`relative block overflow-hidden rounded-md bg-ivory-200 ${className}`}>
      <Image src={m.src} alt={m.alt} fill sizes="160px" className="object-cover" placeholder={m.blur ? "blur" : "empty"} blurDataURL={m.blur} />
    </span>
  );
}

function Library({ library, onPick, onClose, onUploaded }: { library: Media[]; onPick: (m: Media) => void; onClose: () => void; onUploaded: (m: Media[]) => void }) {
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  const file = useRef<HTMLInputElement>(null);
  const shown = useMemo(() => { const s = q.trim().toLowerCase(); return s ? library.filter((m) => `${m.alt} ${m.caption ?? ""}`.toLowerCase().includes(s)) : library; }, [q, library]);
  const upload = () => {
    const files = file.current?.files; if (!files?.length) return;
    const fd = new FormData(); [...files].forEach((f) => fd.append("files", f));
    start(async () => { const r = await uploadMedia(fd); setErr(r.error ?? ""); if (r.media?.length) { onUploaded(r.media); onPick(r.media[0]); } });
  };
  return (
    <div role="dialog" aria-modal="true" aria-label="Media library" className="fixed inset-0 z-50 flex items-end justify-center bg-forest-950/60 p-0 sm:items-center sm:p-6">
      <div className="flex max-h-[90dvh] w-full max-w-4xl flex-col rounded-t-2xl bg-ivory-50 sm:rounded-2xl">
        <div className="flex items-center gap-3 border-b border-ivory-200 p-4">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search images…" className={control} />
          <label className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full bg-forest-800 px-4 py-2 text-sm text-ivory-50">
            {pending ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />} Upload
            <input ref={file} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="sr-only" onChange={upload} />
          </label>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 hover:bg-ivory-200"><X size={18} /></button>
        </div>
        {err && <p role="alert" className="px-4 pt-3 text-sm text-clay">{err}</p>}
        <div className="grid grid-cols-2 gap-3 overflow-y-auto p-4 sm:grid-cols-4">
          {shown.map((m) => (
            <button type="button" key={m.id} onClick={() => onPick(m)} className="group text-left">
              <Thumb m={m} className="aspect-[4/3] w-full" />
              <span className="mt-1 line-clamp-1 text-xs text-forest-800/80 group-hover:text-forest-900">{m.alt || "Untitled"}</span>
            </button>
          ))}
          {!shown.length && <p className="col-span-full py-10 text-center text-sm text-forest-800/60">No images yet. Upload one.</p>}
        </div>
      </div>
    </div>
  );
}

/** Single image field. Submits the media id (or "" to clear). */
export function MediaPicker({ name, label, library, value, hint }: { name: string; label: string; library: Media[]; value?: string | null; hint?: string }) {
  const [lib, setLib] = useState(library);
  const [id, setId] = useState(value ?? "");
  const [open, setOpen] = useState(false);
  const current = lib.find((m) => m.id === id);
  return (
    <Wrap label={label} name={name} hint={hint}>
      <input type="hidden" name={name} value={id} />
      <span className="flex items-center gap-3">
        {current ? <Thumb m={current} /> : <span className="grid h-20 w-28 place-items-center rounded-md border border-dashed border-ivory-300 text-xs text-forest-800/50">No image</span>}
        <span className="flex flex-col gap-1.5">
          <button type="button" onClick={() => setOpen(true)} className="rounded-full border border-forest-700/30 px-3 py-1.5 text-xs text-forest-800 hover:bg-ivory-200">{current ? "Change" : "Choose"}</button>
          {current && <button type="button" onClick={() => setId("")} className="text-xs text-clay">Remove</button>}
        </span>
      </span>
      {open && <Library library={lib} onClose={() => setOpen(false)} onUploaded={(m) => setLib((l) => [...m, ...l])} onPick={(m) => { setId(m.id); setOpen(false); }} />}
    </Wrap>
  );
}

/** Ordered list of images. Submits a JSON array of media ids. */
export function GalleryPicker({ name, label, library, value, hint, onChange }: { name: string; label: string; library: Media[]; value: string[]; hint?: string; onChange?: (ids: string[]) => void }) {
  const [lib, setLib] = useState(library);
  const [ids, setIdsState] = useState(value);
  const [open, setOpen] = useState(false);
  const setIds = (next: string[]) => { setIdsState(next); onChange?.(next); };
  const move = (i: number, d: number) => { const j = i + d; if (j < 0 || j >= ids.length) return; const b = [...ids]; [b[i], b[j]] = [b[j], b[i]]; setIds(b); };
  return (
    <Wrap label={label} name={name} hint={hint}>
      <input type="hidden" name={name} value={JSON.stringify(ids)} />
      <span className="flex flex-wrap gap-3">
        {ids.map((id, i) => { const m = lib.find((x) => x.id === id); return m && (
          <span key={id} className="relative">
            <Thumb m={m} />
            <span className="absolute inset-x-1 bottom-1 flex justify-between">
              <button type="button" aria-label="Move earlier" onClick={() => move(i, -1)} className="rounded bg-white/90 p-0.5"><ArrowUp size={12} className="-rotate-90" /></button>
              <button type="button" aria-label="Remove" onClick={() => setIds(ids.filter((x) => x !== id))} className="rounded bg-white/90 p-0.5 text-clay"><X size={12} /></button>
              <button type="button" aria-label="Move later" onClick={() => move(i, 1)} className="rounded bg-white/90 p-0.5"><ArrowDown size={12} className="-rotate-90" /></button>
            </span>
          </span>); })}
        <button type="button" onClick={() => setOpen(true)} className="grid h-20 w-28 place-items-center rounded-md border border-dashed border-forest-700/30 text-forest-800 hover:bg-ivory-200"><Plus size={18} /></button>
      </span>
      {open && <Library library={lib} onClose={() => setOpen(false)} onUploaded={(m) => setLib((l) => [...m, ...l])} onPick={(m) => { setIds(ids.includes(m.id) ? ids : [...ids, m.id]); setOpen(false); }} />}
    </Wrap>
  );
}

// ---------- homepage section data ----------

const ITEM_TYPES: SectionType[] = ["intro", "regions", "split", "features", "promo"];
const MEDIA_LIST_TYPES: SectionType[] = ["split", "mosaic"];
const KIND_TYPES: SectionType[] = ["destinations", "listings"];

/** Edits the type-specific `data` of a section and submits it as one JSON field. */
export function SectionDataEditor({ type, initial, library }: { type: SectionType; initial: SectionData; library: Media[] }) {
  const [items, setItems] = useState<SectionItem[]>(initial.items ?? []);
  const [mediaIds, setMediaIds] = useState<string[]>(initial.mediaIds ?? []);
  const [kind, setKind] = useState(initial.kind ?? (type === "destinations" ? "villages" : "trekking"));
  const [limit, setLimit] = useState(initial.limit ?? (type === "reviews" ? 6 : 3));
  const [placement, setPlacement] = useState(initial.placement ?? "home_middle");
  const [lib, setLib] = useState(library);
  const [pickFor, setPickFor] = useState<number | null>(null);

  const data: SectionData = {
    ...(ITEM_TYPES.includes(type) && { items: items.map((i) => ({ title: i.title, subtitle: i.subtitle, text: i.text, icon: i.icon, mediaId: i.mediaId, url: i.url })) }),
    ...(MEDIA_LIST_TYPES.includes(type) && { mediaIds }),
    ...(KIND_TYPES.includes(type) && { kind, limit }),
    ...(type === "reviews" && { limit }),
    ...(type === "ad" && { placement }),
  };
  const set = (i: number, patch: Partial<SectionItem>) => setItems((a) => a.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  const move = (i: number, d: number) => setItems((a) => { const b = [...a]; const j = i + d; if (j < 0 || j >= b.length) return a; [b[i], b[j]] = [b[j], b[i]]; return b; });

  return (
    <div className="space-y-5">
      <input type="hidden" name="data" value={JSON.stringify(data)} />
      {KIND_TYPES.includes(type) && (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm"><span className="mb-1 block text-xs font-medium uppercase tracking-wider text-forest-700">Show</span>
            <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} className={control}>
              {[["villages", "Destinations"], ["homestays", "Homestays"], ["experiences", "Experiences"], ["trekking", "Treks"], ["workation", "Workations"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <label className="block text-sm"><span className="mb-1 block text-xs font-medium uppercase tracking-wider text-forest-700">How many</span>
            <input type="number" min={1} max={12} value={limit} onChange={(e) => setLimit(Number(e.target.value) || 1)} className={control} />
          </label>
          <p className="text-xs text-forest-800/60 sm:col-span-2">Featured, published listings appear first, in their position order.</p>
        </div>
      )}
      {type === "reviews" && (
        <label className="block text-sm"><span className="mb-1 block text-xs font-medium uppercase tracking-wider text-forest-700">How many featured reviews</span>
          <input type="number" min={1} max={12} value={limit} onChange={(e) => setLimit(Number(e.target.value) || 1)} className={control} />
        </label>
      )}
      {type === "ad" && (
        <label className="block text-sm"><span className="mb-1 block text-xs font-medium uppercase tracking-wider text-forest-700">Ad placement shown here</span>
          <select value={placement} onChange={(e) => setPlacement(e.target.value as typeof placement)} className={control}>
            {["home_top", "home_middle", "home_bottom"].map((p) => <option key={p}>{p}</option>)}
          </select>
        </label>
      )}
      {MEDIA_LIST_TYPES.includes(type) && <GalleryPicker name="_mediaIds" label="Photos (in order)" library={lib} value={mediaIds} onChange={setMediaIds} />}

      {ITEM_TYPES.includes(type) && (
        <fieldset className="space-y-3">
          <legend className="text-xs font-medium uppercase tracking-wider text-forest-700">{type === "split" ? "Bullet points" : "Items"}</legend>
          {items.map((it, i) => (
            <div key={i} className="grid gap-2 rounded-xl border border-ivory-300 bg-white p-3 sm:grid-cols-2">
              <input aria-label="Item title" placeholder="Title" value={it.title} onChange={(e) => set(i, { title: e.target.value })} className={control} />
              {type !== "split" && <input aria-label="Item subtitle" placeholder="Subtitle (optional)" value={it.subtitle ?? ""} onChange={(e) => set(i, { subtitle: e.target.value })} className={control} />}
              {type !== "split" && <textarea aria-label="Item text" placeholder="Text" rows={2} value={it.text ?? ""} onChange={(e) => set(i, { text: e.target.value })} className={`${control} sm:col-span-2`} />}
              {(type === "intro" || type === "features") && (
                <select aria-label="Icon" value={it.icon ?? ""} onChange={(e) => set(i, { icon: e.target.value })} className={control}>
                  {["", "flame", "footprints", "mountain", "home", "leaf", "map", "star", "heart", "wifi", "car", "camera", "utensils"].map((x) => <option key={x} value={x}>{x || "No icon"}</option>)}
                </select>
              )}
              {(type === "regions" || type === "features" || type === "promo") && <input aria-label="Link" placeholder="Link (/villages or https://…)" value={it.url ?? ""} onChange={(e) => set(i, { url: e.target.value })} className={control} />}
              {(type === "regions" || type === "promo") && (
                <div className="flex items-center gap-2 sm:col-span-2">
                  {(() => { const m = lib.find((x) => x.id === it.mediaId); return m ? <Thumb m={m} className="h-12 w-16" /> : null; })()}
                  <button type="button" onClick={() => setPickFor(i)} className="rounded-full border border-forest-700/30 px-3 py-1 text-xs">{it.mediaId ? "Change image" : "Choose image"}</button>
                </div>
              )}
              <div className="flex gap-2 sm:col-span-2">
                <button type="button" aria-label="Move up" onClick={() => move(i, -1)} className="rounded p-1 hover:bg-ivory-200"><ArrowUp size={14} /></button>
                <button type="button" aria-label="Move down" onClick={() => move(i, 1)} className="rounded p-1 hover:bg-ivory-200"><ArrowDown size={14} /></button>
                <button type="button" aria-label="Remove item" onClick={() => setItems((a) => a.filter((_, k) => k !== i))} className="ml-auto rounded p-1 text-clay hover:bg-clay/10"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
          {items.length < 12 && <button type="button" onClick={() => setItems((a) => [...a, { title: "" }])} className="inline-flex items-center gap-1.5 rounded-full border border-forest-700/30 px-4 py-1.5 text-sm"><Plus size={14} /> Add item</button>}
        </fieldset>
      )}
      {pickFor !== null && <Library library={lib} onClose={() => setPickFor(null)} onUploaded={(m) => setLib((l) => [...m, ...l])} onPick={(m) => { set(pickFor, { mediaId: m.id }); setPickFor(null); }} />}
    </div>
  );
}

/** Bulk upload for the media library page. */
export function MediaUploader() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const ref = useRef<HTMLFormElement>(null);
  return (
    <form ref={ref} className="flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-forest-700/30 bg-white p-4"
      action={(fd) => start(async () => {
        const r = await uploadMedia(fd);
        setMsg(r.error ? { ok: false, text: r.error } : { ok: true, text: `Uploaded ${r.media?.length ?? 0} image(s).` });
        if (!r.error) ref.current?.reset();
      })}>
      <input name="files" type="file" multiple required accept="image/jpeg,image/png,image/webp,image/avif" className="text-sm" />
      <input name="alt" placeholder="Describe the image (alt text)" maxLength={300} className={`${control} max-w-xs`} />
      <button disabled={pending} className="inline-flex items-center gap-2 rounded-full bg-forest-800 px-5 py-2 text-sm text-ivory-50 disabled:opacity-60">
        {pending ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />} Upload
      </button>
      <p className="w-full text-xs text-forest-800/60">JPEG, PNG, WebP or AVIF up to 10 MB each, max 10 at a time. Images are resized to 2560 px, converted to WebP and stripped of location metadata.</p>
      {msg && <p role={msg.ok ? "status" : "alert"} className={`w-full text-sm ${msg.ok ? "text-forest-700" : "text-clay"}`}>{msg.text}</p>}
    </form>
  );
}
