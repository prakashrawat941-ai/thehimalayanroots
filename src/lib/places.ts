import "server-only";

/**
 * Server-side Google Places (New) + Geocoding helpers. The API key never reaches the browser:
 * the client talks only to our /api/places/* routes.
 */

export interface PlaceDetails {
  placeId: string;
  name?: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  // Each of these is present only if Google actually returned it for this place.
  locality?: string;
  postOffice?: string;
  tehsil?: string;
  district?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface Suggestion {
  placeId: string;
  main: string;
  secondary: string;
}

export class PlacesError extends Error {
  constructor(public code: "not_configured" | "denied" | "quota" | "bad_request" | "upstream", message: string, public status: number) {
    super(message);
  }
}

export function getPlacesKey(): string {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    console.error("[places] GOOGLE_MAPS_API_KEY is not set; location search is disabled.");
    throw new PlacesError("not_configured", "Location search is temporarily unavailable.", 503);
  }
  return key;
}

interface GoogleError { error?: { status?: string; message?: string } }

async function googleFetch(url: string, init: RequestInit): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(url, { ...init, cache: "no-store", signal: AbortSignal.timeout(8000) });
  } catch {
    throw new PlacesError("upstream", "Location service did not respond. Please try again.", 504);
  }
  const body = (await res.json().catch(() => ({}))) as GoogleError;
  if (res.ok) return body;
  const status = body.error?.status ?? String(res.status);
  // Log the real reason server-side (never the key) so a misconfiguration is diagnosable.
  console.error(`[places] ${res.status} ${status}: ${body.error?.message ?? ""}`);
  if (res.status === 400) throw new PlacesError("bad_request", "That search could not be processed.", 400);
  if (res.status === 403 || status === "PERMISSION_DENIED") throw new PlacesError("denied", "Location search is temporarily unavailable.", 502);
  if (res.status === 429) throw new PlacesError("quota", "Location search is busy. Please try again in a moment.", 429);
  throw new PlacesError("upstream", "Location search failed. Please try again.", 502);
}

// ---------- Autocomplete ----------

interface AutocompleteResponse {
  suggestions?: {
    placePrediction?: {
      placeId: string;
      text?: { text: string };
      structuredFormat?: { mainText?: { text: string }; secondaryText?: { text: string } };
    };
  }[];
}

export async function autocomplete(input: string, sessionToken: string): Promise<Suggestion[]> {
  const data = (await googleFetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": getPlacesKey() },
    body: JSON.stringify({
      input,
      sessionToken,
      languageCode: "en",
      regionCode: "IN",
      includedRegionCodes: ["in"],
      // A bias, not a restriction: Uttarakhand ranks first, but "delhi" or any other Indian place still resolves.
      locationBias: { rectangle: { low: { latitude: 28.7, longitude: 77.5 }, high: { latitude: 31.5, longitude: 81.1 } } },
    }),
  })) as AutocompleteResponse;

  return (data.suggestions ?? []).flatMap((s) => {
    const p = s.placePrediction;
    if (!p?.placeId) return [];
    const main = p.structuredFormat?.mainText?.text ?? p.text?.text ?? "";
    return [{ placeId: p.placeId, main, secondary: p.structuredFormat?.secondaryText?.text ?? "" }];
  });
}

// ---------- Details / reverse geocode ----------

interface Component { longText?: string; long_name?: string; types?: string[] }

function parseComponents(components: Component[]): Partial<PlaceDetails> {
  const find = (...types: string[]) => {
    for (const t of types) {
      const c = components.find((x) => x.types?.includes(t));
      const v = c?.longText ?? c?.long_name;
      if (v) return v;
    }
    return undefined;
  };
  const out: Partial<PlaceDetails> = {
    locality: find("locality", "sublocality_level_1", "sublocality", "neighborhood", "administrative_area_level_4"),
    // Google has no "post office" component for India; postal_town is the closest and is usually absent.
    postOffice: find("postal_town"),
    tehsil: find("administrative_area_level_3"),
    district: find("administrative_area_level_2"),
    state: find("administrative_area_level_1"),
    postalCode: find("postal_code"),
    country: find("country"),
  };
  return Object.fromEntries(Object.entries(out).filter(([, v]) => v)) as Partial<PlaceDetails>;
}

interface PlaceResponse {
  id?: string;
  displayName?: { text: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  addressComponents?: Component[];
}

export async function placeDetails(placeId: string, sessionToken?: string): Promise<PlaceDetails> {
  const qs = sessionToken ? `?sessionToken=${encodeURIComponent(sessionToken)}` : "";
  const p = (await googleFetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}${qs}`, {
    headers: {
      "X-Goog-Api-Key": getPlacesKey(),
      "X-Goog-FieldMask": "id,displayName,formattedAddress,location,addressComponents",
    },
  })) as PlaceResponse;
  if (!p.location || !p.formattedAddress) throw new PlacesError("upstream", "That place has no usable location.", 502);
  return {
    placeId: p.id ?? placeId,
    name: p.displayName?.text,
    formattedAddress: p.formattedAddress,
    lat: p.location.latitude,
    lng: p.location.longitude,
    ...parseComponents(p.addressComponents ?? []),
  };
}

interface GeocodeResponse {
  status?: string;
  error_message?: string;
  results?: { place_id: string; formatted_address: string; address_components?: Component[] }[];
}

/** Reverse-geocode coordinates (GPS or map pin). Coordinates are kept exactly as given. */
export async function reverseGeocode(lat: number, lng: number): Promise<PlaceDetails> {
  const qs = new URLSearchParams({ latlng: `${lat},${lng}`, language: "en", key: getPlacesKey() });
  const data = (await googleFetch(`https://maps.googleapis.com/maps/api/geocode/json?${qs}`, {})) as GeocodeResponse;
  // The Geocoding API reports key/permission problems with HTTP 200 and a status field.
  if (data.status === "REQUEST_DENIED") {
    console.error(`[places] geocode REQUEST_DENIED: ${data.error_message ?? ""}`);
    throw new PlacesError("denied", "Address lookup is temporarily unavailable.", 502);
  }
  if (data.status === "OVER_QUERY_LIMIT") throw new PlacesError("quota", "Location search is busy. Please try again in a moment.", 429);
  const first = data.results?.[0];
  if (!first) throw new PlacesError("bad_request", "No address was found at that spot.", 404);
  // Merge components from all results so district / state / PIN are filled when the top result omits them.
  const merged = (data.results ?? []).flatMap((r) => r.address_components ?? []);
  return { placeId: first.place_id, formattedAddress: first.formatted_address, lat, lng, ...parseComponents(merged) };
}

// ---------- Basic abuse protection ----------

const hits = new Map<string, { n: number; reset: number }>();

/** Per-IP fixed-window limit so the public proxy can't be used to burn the API quota. */
export function rateLimit(ip: string, max = 90, windowMs = 60_000): boolean {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || h.reset < now) {
    if (hits.size > 5000) hits.clear();
    hits.set(ip, { n: 1, reset: now + windowMs });
    return true;
  }
  return ++h.n <= max;
}
