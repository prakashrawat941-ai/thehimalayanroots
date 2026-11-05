import type { NextRequest } from "next/server";
import { z } from "zod";
import { PlacesError, autocomplete, rateLimit } from "@/lib/places";

const params = z.object({
  q: z.string().trim().min(2).max(100),
  token: z.string().uuid(),
});

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!rateLimit(ip)) return Response.json({ error: "quota", message: "Too many searches. Please slow down." }, { status: 429 });

  const parsed = params.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) {
    const short = parsed.error.issues.some((i) => i.path[0] === "q");
    return Response.json({ error: "bad_request", message: short ? "Type at least 2 characters." : "Invalid search request." }, { status: 400 });
  }

  try {
    const suggestions = await autocomplete(parsed.data.q, parsed.data.token);
    return Response.json({ suggestions });
  } catch (e) {
    if (e instanceof PlacesError) return Response.json({ error: e.code, message: e.message }, { status: e.status });
    return Response.json({ error: "upstream", message: "Location search failed." }, { status: 500 });
  }
}
