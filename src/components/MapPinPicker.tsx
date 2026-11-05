"use client";
import { useEffect, useRef, useState } from "react";
import { Check, Loader2, MapPin, X } from "lucide-react";
import type { PlaceDetails } from "@/lib/places";

// Only the slice of the Maps JS API this component uses.
interface GMap {
  getCenter(): { lat(): number; lng(): number };
  addListener(event: string, cb: () => void): void;
}
interface GMaps { Map: new (el: HTMLElement, opts: Record<string, unknown>) => GMap }
declare global { interface Window { google?: { maps: GMaps }; __hrMapsReady?: () => void } }

const BROWSER_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY;
const UTTARAKHAND = { lat: 30.07, lng: 79.3 };

let loader: Promise<void> | null = null;
function loadMaps(): Promise<void> {
  if (window.google?.maps) return Promise.resolve();
  loader ??= new Promise<void>((resolve, reject) => {
    window.__hrMapsReady = resolve;
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${BROWSER_KEY}&loading=async&callback=__hrMapsReady`;
    s.async = true;
    s.onerror = () => { loader = null; reject(new Error("Google Maps failed to load.")); };
    document.head.appendChild(s);
  });
  return loader;
}

/** Full-screen map with a fixed centre pin: pan the map, then confirm the address under the pin. */
export function MapPinPicker({ start, onPick, onClose }: { start: PlaceDetails | null; onPick: (p: PlaceDetails) => void; onClose: () => void }) {
  const el = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">(BROWSER_KEY ? "loading" : "error");
  const [error, setError] = useState(BROWSER_KEY ? "" : "Map selection needs NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY to be set.");
  const [place, setPlace] = useState<PlaceDetails | null>(null);
  const [looking, setLooking] = useState(false);
  const seq = useRef(0);

  useEffect(() => {
    if (!BROWSER_KEY) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const lookup = async (lat: number, lng: number) => {
      const mine = ++seq.current;
      setLooking(true);
      try {
        const res = await fetch(`/api/places/details?${new URLSearchParams({ lat: String(lat), lng: String(lng) })}`);
        const data = await res.json();
        if (mine !== seq.current) return;
        if (!res.ok) { setPlace(null); setError(data.message ?? "No address at that spot."); } else { setPlace(data.place); setError(""); }
      } catch {
        if (mine === seq.current) setError("Couldn't look up that spot.");
      } finally {
        if (mine === seq.current) setLooking(false);
      }
    };

    loadMaps().then(() => {
      if (cancelled || !el.current || !window.google) return;
      const c = start ? { lat: start.lat, lng: start.lng } : UTTARAKHAND;
      const map = new window.google.maps.Map(el.current, {
        center: c, zoom: start ? 15 : 8, mapTypeId: "terrain",
        gestureHandling: "greedy", // one-finger pan on phones
        disableDefaultUI: true, zoomControl: true, clickableIcons: false,
      });
      const settle = () => {
        clearTimeout(timer);
        timer = setTimeout(() => { const m = map.getCenter(); lookup(m.lat(), m.lng()); }, 350);
      };
      map.addListener("idle", settle);
      setState("ready");
    }).catch((e: Error) => { if (!cancelled) { setState("error"); setError(e.message); } });

    return () => { cancelled = true; clearTimeout(timer); };
  }, [start]);

  return (
    <div role="dialog" aria-modal="true" aria-label="Choose location on map" className="fixed inset-0 z-50 flex flex-col bg-forest-950">
      <div className="flex items-center justify-between px-4 py-3 text-ivory-50">
        <p className="font-display text-xl">Move the map to your pickup point</p>
        <button type="button" onClick={onClose} aria-label="Close map" className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/10"><X size={20} /></button>
      </div>
      <div className="relative flex-1">
        <div ref={el} className="absolute inset-0" />
        {state === "loading" && <div className="absolute inset-0 grid place-items-center text-ivory-100"><Loader2 className="animate-spin" /></div>}
        {state === "ready" && <MapPin size={40} aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full fill-saffron text-forest-950 drop-shadow-lg" />}
      </div>
      <div className="space-y-3 bg-ivory-50 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {error && <p role="alert" className="text-sm text-clay">{error}</p>}
        {!error && (
          <p className="min-h-10 text-sm text-forest-900" aria-live="polite">
            {looking ? "Finding address…" : place ? place.formattedAddress : "Pan the map to place the pin."}
          </p>
        )}
        <button
          type="button"
          disabled={!place || looking}
          onClick={() => place && onPick(place)}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-forest-800 px-6 py-3.5 text-sm font-medium text-ivory-50 transition hover:bg-forest-700 disabled:opacity-50"
        >
          <Check size={16} /> Confirm this location
        </button>
      </div>
    </div>
  );
}
