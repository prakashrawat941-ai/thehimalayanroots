import type { NextRequest } from "next/server";
import { z } from "zod";
import { PlacesError, placeDetails, rateLimit, reverseGeocode } from "@/lib/places";

// Either a Place ID (from a selected suggestion) or coordinates (GPS / map pin). Coordinates must be inside India.
const byId = z.object({ placeId: z.string().min(10).max(300), token: z.string().uuid().optional() });
const byCoords = z.object({
  lat: z.coerce.number().min(6).max(37.5),
  lng: z.coerce.number().min(68).max(98),
});

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!rateLimit(ip)) return Response.json({ error: "quota", message: "Too many requests. Please slow down." }, { status: 429 });

  const raw = Object.fromEntries(request.nextUrl.searchParams);
  try {
    const id = byId.safeParse(raw);
    if (id.success) return Response.json({ place: await placeDetails(id.data.placeId, id.data.token) });

    const coords = byCoords.safeParse(raw);
    if (coords.success) return Response.json({ place: await reverseGeocode(coords.data.lat, coords.data.lng) });

    const outside = "lat" in raw || "lng" in raw;
    return Response.json(
      { error: "bad_request", message: outside ? "That location is outside India." : "Provide a placeId or coordinates." },
      { status: 400 },
    );
  } catch (e) {
    if (e instanceof PlacesError) return Response.json({ error: e.code, message: e.message }, { status: e.status });
    return Response.json({ error: "upstream", message: "Location lookup failed." }, { status: 500 });
  }
}
