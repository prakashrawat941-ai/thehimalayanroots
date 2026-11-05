"use client";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { ListingCard } from "./ListingCard";
import type { Listing } from "@/lib/data/types";

export function ListingGrid({ listings }: { listings: Listing[] }) {
  const [region, setRegion] = useState<"All" | "Garhwal" | "Kumaon">("All");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return listings.filter(
      (l) =>
        (region === "All" || l.region === region) &&
        (!q || `${l.title} ${l.location} ${l.tags.join(" ")}`.toLowerCase().includes(q)),
    );
  }, [listings, region, query]);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div role="group" aria-label="Filter by region" className="flex gap-2">
          {(["All", "Garhwal", "Kumaon"] as const).map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={region === r}
              onClick={() => setRegion(r)}
              className={`rounded-full px-5 py-2 text-sm transition ${region === r ? "bg-forest-800 text-ivory-50" : "bg-ivory-200 text-forest-800 hover:bg-ivory-300"}`}
            >
              {r}
            </button>
          ))}
        </div>
        <label className="relative block sm:w-72">
          <span className="sr-only">Search</span>
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-forest-600" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search places, tags…"
            maxLength={60}
            className="w-full rounded-full border border-ivory-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-forest-600"
          />
        </label>
      </div>
      {visible.length === 0 ? (
        <p className="py-16 text-center text-forest-800/70">Nothing matches that search yet.</p>
      ) : (
        <ul className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((l) => (
            <li key={l.slug}><ListingCard listing={l} /></li>
          ))}
        </ul>
      )}
    </div>
  );
}
