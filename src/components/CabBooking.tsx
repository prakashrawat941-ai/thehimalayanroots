"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Loader2, LocateFixed, Map as MapIcon } from "lucide-react";
import { createCabRequest } from "@/app/actions/cab";
import { Field, StatusMessage, SubmitButton, inputClass, useForm } from "./forms";
import { PlaceSearch, saveRecent } from "./PlaceSearch";
import { CAB_VEHICLES } from "@/lib/validation";
import type { PlaceDetails } from "@/lib/places";

// Maps JS is heavy; only fetch it when someone opens the map.
const MapPinPicker = dynamic(() => import("./MapPinPicker").then((m) => m.MapPinPicker), { ssr: false });

const VEHICLE_LABEL: Record<(typeof CAB_VEHICLES)[number], string> = {
  hatchback: "Hatchback · up to 4",
  sedan: "Sedan · up to 4",
  suv: "SUV · up to 6",
  tempo: "Tempo Traveller · up to 12",
};

const ROWS: [keyof PlaceDetails, string][] = [
  ["locality", "Village / Locality"],
  ["postOffice", "Post office"],
  ["tehsil", "Tehsil"],
  ["district", "District"],
  ["state", "State"],
  ["postalCode", "PIN code"],
  ["country", "Country"],
];

/** Shows only the fields the API actually returned. */
function PlaceSummary({ place }: { place: PlaceDetails }) {
  const rows = ROWS.filter(([k]) => place[k]);
  return (
    <div className="mt-3 rounded-xl bg-ivory-100 p-4 text-sm">
      <p className="font-medium text-forest-950">{place.formattedAddress}</p>
      {rows.length > 0 && (
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-forest-800">
          {rows.map(([k, label]) => (
            <div key={k} className="contents">
              <dt className="text-forest-800/60">{label}</dt>
              <dd>{String(place[k])}</dd>
            </div>
          ))}
        </dl>
      )}
      <p className="mt-3 text-xs text-forest-800/60">
        {place.lat.toFixed(5)}, {place.lng.toFixed(5)} · Place ID {place.placeId.slice(0, 14)}…
      </p>
    </div>
  );
}

const geoMessages: Record<number, string> = {
  1: "Location permission was denied. Allow it for this site in your browser settings, or search for your pickup instead.",
  2: "Your device couldn't determine its location. Move to an open area, or search for your pickup instead.",
  3: "Finding your location timed out. Try again, or search for your pickup instead.",
};

export function CabBooking({ signedIn }: { signedIn: boolean }) {
  const [state, action, pending] = useForm(createCabRequest);
  const [pickup, setPickup] = useState<PlaceDetails | null>(null);
  const [drop, setDrop] = useState<PlaceDetails | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState("");
  const [mapOpen, setMapOpen] = useState(false);

  const useCurrent = () => {
    setGeoError("");
    if (!("geolocation" in navigator)) return setGeoError("This browser doesn't support location. Search for your pickup instead.");
    if (!window.isSecureContext) return setGeoError("Location needs a secure (HTTPS) connection. Search for your pickup instead.");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(`/api/places/details?${new URLSearchParams({ lat: String(coords.latitude), lng: String(coords.longitude) })}`);
          const data = await res.json();
          if (!res.ok) throw new Error(data.message ?? "Couldn't find an address for your location.");
          saveRecent(data.place);
          setPickup(data.place);
        } catch (e) {
          setGeoError((e as Error).message);
        } finally {
          setLocating(false);
        }
      },
      (err) => { setGeoError(geoMessages[err.code] ?? "Couldn't get your location."); setLocating(false); },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 30_000 },
    );
  };

  if (!signedIn) {
    return (
      <div className="rounded-2xl bg-ivory-100 p-6 text-center">
        <p className="text-sm text-forest-800">Sign in to request a cab.</p>
        <a href={`/login?next=${encodeURIComponent("/cab")}`} className="mt-4 inline-block rounded-full bg-forest-800 px-6 py-3 text-sm text-ivory-50">Sign in</a>
      </div>
    );
  }

  const btn = "inline-flex min-h-11 items-center gap-2 rounded-full border border-forest-700/30 px-4 text-sm text-forest-800 transition hover:bg-ivory-100 disabled:opacity-60";

  return (
    <>
      <form action={action} className="space-y-7">
        <input type="hidden" name="pickup" value={pickup ? JSON.stringify(pickup) : ""} />
        <input type="hidden" name="drop" value={drop ? JSON.stringify(drop) : ""} />

        <div>
          <PlaceSearch
            label="Pickup location"
            placeholder="Search a village, town or landmark"
            value={pickup}
            onChange={setPickup}
            actions={
              <>
                <button type="button" onClick={useCurrent} disabled={locating} className={btn}>
                  {locating ? <Loader2 size={16} className="animate-spin" /> : <LocateFixed size={16} />} Use current location
                </button>
                <button type="button" onClick={() => setMapOpen(true)} className={btn}><MapIcon size={16} /> Pin on map</button>
              </>
            }
          />
          {geoError && <p role="alert" className="mt-2 text-xs text-clay">{geoError}</p>}
          {state.fieldErrors?.pickup?.[0] && <p role="alert" className="mt-2 text-xs text-clay">{state.fieldErrors.pickup[0]}</p>}
          {pickup && <PlaceSummary place={pickup} />}
        </div>

        <div>
          <PlaceSearch label="Drop location" placeholder="Search a village, town, city, landmark or PIN" value={drop} onChange={setDrop} />
          {(state.fieldErrors?.drop?.[0]) && <p role="alert" className="mt-2 text-xs text-clay">{state.fieldErrors.drop[0]}</p>}
          {drop && <PlaceSummary place={drop} />}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Pickup date & time (IST)" error={state.fieldErrors?.pickupAt}>
            <input
              type="datetime-local"
              name="pickupAt"
              required
              // Earliest slot = now + 30 min in IST; set on focus because the clock can't be read during render.
              onFocus={(e) => { e.currentTarget.min = new Date(Date.now() + 30 * 60_000 + 5.5 * 3_600_000).toISOString().slice(0, 16); }}
              className={inputClass}
            />
          </Field>
          <Field label="Passengers" error={state.fieldErrors?.passengers}>
            <input type="number" name="passengers" min={1} max={12} defaultValue={2} required inputMode="numeric" className={inputClass} />
          </Field>
        </div>
        <Field label="Vehicle" error={state.fieldErrors?.vehicle}>
          <select name="vehicle" defaultValue="sedan" className={inputClass}>
            {CAB_VEHICLES.map((v) => <option key={v} value={v}>{VEHICLE_LABEL[v]}</option>)}
          </select>
        </Field>
        <Field label="Notes (optional)" error={state.fieldErrors?.notes}>
          <textarea name="notes" rows={2} maxLength={500} placeholder="Luggage, landmarks, a driver who speaks Garhwali…" className={inputClass} />
        </Field>

        <StatusMessage state={state} />
        <SubmitButton pending={pending}>Request cab</SubmitButton>
        <p className="text-center text-xs text-forest-800/60">No payment now. We confirm your driver and fare first.</p>
      </form>

      {mapOpen && (
        <MapPinPicker
          start={pickup}
          onClose={() => setMapOpen(false)}
          onPick={(p) => { saveRecent(p); setPickup(p); setMapOpen(false); }}
        />
      )}
    </>
  );
}
