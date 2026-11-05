"use client";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Clock, Loader2, MapPin, Search, X } from "lucide-react";
import { inputClass } from "./forms";
import type { PlaceDetails, Suggestion } from "@/lib/places";

const RECENTS_KEY = "hr.recent-places";
const MAX_RECENTS = 5;

function loadRecents(): PlaceDetails[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENTS_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENTS) : [];
  } catch {
    return [];
  }
}

export function saveRecent(place: PlaceDetails) {
  try {
    const next = [place, ...loadRecents().filter((p) => p.placeId !== place.placeId)].slice(0, MAX_RECENTS);
    localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable (private mode): recents are a convenience only */
  }
}

export const placeLabel = (p: PlaceDetails) => p.name && !p.formattedAddress.startsWith(p.name) ? `${p.name}, ${p.formattedAddress}` : p.formattedAddress;

interface Props {
  label: string;
  placeholder: string;
  value: PlaceDetails | null;
  onChange: (place: PlaceDetails | null) => void;
  /** Buttons rendered under the input (GPS, map pin). */
  actions?: React.ReactNode;
}

/**
 * Real-time place search backed by our /api/places proxy (Google Places API New).
 * Suggestions appear after 2 characters with a 300ms debounce; stale responses are aborted.
 */
export function PlaceSearch({ label, placeholder, value, onChange, actions }: Props) {
  const uid = useId();
  const listId = `${uid}-list`;
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const token = useRef<string>("");
  const abort = useRef<AbortController | null>(null);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [results, setResults] = useState<Suggestion[] | null>(null);
  const [recents, setRecents] = useState<PlaceDetails[]>([]);
  const [error, setError] = useState("");
  const [active, setActive] = useState(-1);

  const sessionToken = () => (token.current ||= crypto.randomUUID());

  // A confirmed place (typed-and-chosen, GPS, map pin or recent) is shown in the field; otherwise the typed text.
  const shown = value ? placeLabel(value) : query;

  // Close when tapping or clicking outside.
  useEffect(() => {
    const away = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, []);

  const search = useCallback(async (q: string) => {
    abort.current?.abort();
    const ctl = new AbortController();
    abort.current = ctl;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/places/autocomplete?${new URLSearchParams({ q, token: sessionToken() })}`, { signal: ctl.signal });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Search failed.");
      setResults(data.suggestions);
      setActive(-1);
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setResults(null);
      setError((e as Error).message || "Search failed.");
    } finally {
      if (abort.current === ctl) setLoading(false);
    }
  }, []);

  // 300ms debounce, minimum 2 characters.
  useEffect(() => {
    const q = query.trim();
    if (value || q.length < 2) return; // nothing to search; stale results are hidden by showResults
    const t = setTimeout(() => search(q), 300);
    return () => { clearTimeout(t); abort.current?.abort(); };
  }, [query, value, search]);

  const choose = useCallback(async (s: Suggestion) => {
    setResolving(true);
    setError("");
    try {
      const res = await fetch(`/api/places/details?${new URLSearchParams({ placeId: s.placeId, token: sessionToken() })}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Couldn't load that place.");
      saveRecent(data.place);
      setRecents(loadRecents());
      onChange(data.place);
      setOpen(false);
      token.current = ""; // a selection ends the billing session; the next search starts a new one
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setResolving(false);
    }
  }, [onChange]);

  const pickRecent = (p: PlaceDetails) => { onChange(p); setOpen(false); };

  const showRecents = open && !value && query.trim().length < 2 && recents.length > 0;
  const showResults = open && !value && query.trim().length >= 2;
  const options: (Suggestion | PlaceDetails)[] = showRecents ? recents : showResults && results ? results : [];

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { setOpen(false); return; }
    if (!options.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((a) => (a + 1) % options.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a <= 0 ? options.length - 1 : a - 1)); }
    else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      const o = options[active];
      if (showRecents) pickRecent(o as PlaceDetails); else choose(o as Suggestion);
    }
  };

  const clear = () => {
    abort.current?.abort();
    setQuery(""); setResults(null); setError(""); setActive(-1);
    onChange(null);
    setOpen(true);
    input.current?.focus();
  };

  // On phones the keyboard covers the lower half: bring the field to the top once the keyboard has opened.
  const onFocus = () => {
    setRecents(loadRecents());
    setOpen(true);
    setTimeout(() => input.current?.scrollIntoView({ block: "start", behavior: "smooth" }), 300);
  };

  const status = loading ? "Searching…" : resolving ? "Loading place…" : showResults && results && !results.length ? "No places found" : "";

  return (
    <div
      ref={root}
      className="relative"
      // Tab / the Android keyboard's Next key move focus without a pointer event; close when focus leaves this field.
      onBlur={(e) => { if (!root.current?.contains(e.relatedTarget as Node | null)) setOpen(false); }}
    >
      <label htmlFor={`${uid}-input`} className="mb-1.5 block text-sm font-medium text-forest-800">{label}</label>
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-forest-700/60" aria-hidden />
        <input
          ref={input}
          id={`${uid}-input`}
          type="search"
          role="combobox"
          aria-expanded={open && options.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${uid}-opt-${active}` : undefined}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="search"
          value={shown}
          placeholder={placeholder}
          maxLength={100}
          onFocus={onFocus}
          onChange={(e) => { setQuery(e.target.value); setError(""); setResults(null); setOpen(true); if (value) onChange(null); }}
          onKeyDown={onKey}
          className={`${inputClass} scroll-mt-24 pl-10 pr-20 [&::-webkit-search-cancel-button]:hidden`}
        />
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {(loading || resolving) && <Loader2 size={16} className="animate-spin text-forest-700" aria-hidden />}
          {shown && (
            <button type="button" onClick={clear} aria-label={`Clear ${label.toLowerCase()}`} className="grid h-9 w-9 place-items-center rounded-full text-forest-800/70 hover:bg-ivory-100">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <p role="status" aria-live="polite" className="sr-only">{status}</p>

      {open && (showRecents || showResults || error) && (
        <div
          onPointerDown={(e) => e.preventDefault()} /* taps inside the list must not blur the input and dismiss the keyboard */
          className="absolute inset-x-0 top-full z-30 mt-1.5 max-h-[min(50dvh,22rem)] overflow-y-auto overscroll-contain rounded-xl border border-ivory-300 bg-white shadow-xl">
          {error && <p role="alert" className="px-4 py-3 text-sm text-clay">{error}</p>}
          {showRecents && <p className="px-4 pb-1 pt-3 text-[11px] font-medium uppercase tracking-[0.2em] text-forest-700/60">Recent</p>}
          {showResults && loading && !results && <p className="px-4 py-3 text-sm text-forest-800/70">Searching…</p>}
          {showResults && results && !results.length && !error && (
            <p className="px-4 py-4 text-sm text-forest-800/70">No places found for “{shown.trim()}”. Try a nearby town or district.</p>
          )}
          {options.length > 0 && (
            <ul id={listId} role="listbox" aria-label={`${label} suggestions`}>
              {options.map((o, i) => {
                const recent = showRecents;
                const main = recent ? ((o as PlaceDetails).name ?? (o as PlaceDetails).formattedAddress.split(",")[0]) : (o as Suggestion).main;
                const secondary = recent ? (o as PlaceDetails).formattedAddress : (o as Suggestion).secondary;
                return (
                  <li
                    key={recent ? (o as PlaceDetails).placeId : (o as Suggestion).placeId}
                    id={`${uid}-opt-${i}`}
                    role="option"
                    aria-selected={i === active}
                    // preventDefault keeps focus in the input so the mobile keyboard doesn't flicker.
                    onPointerDown={(e) => e.preventDefault()}
                    onClick={() => (recent ? pickRecent(o as PlaceDetails) : choose(o as Suggestion))}
                    onMouseEnter={() => setActive(i)}
                    className={`flex min-h-14 cursor-pointer items-center gap-3 px-4 py-2.5 ${i === active ? "bg-ivory-100" : ""}`}
                  >
                    {recent ? <Clock size={16} className="shrink-0 text-forest-700/60" /> : <MapPin size={16} className="shrink-0 text-saffron" />}
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-forest-950">{main}</span>
                      {secondary && <span className="block truncate text-xs text-forest-800/70">{secondary}</span>}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
      {actions && <div className="mt-2 flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
