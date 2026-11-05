import type { Listing } from "./data/types";

export const inr = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export function formatPrice(l: Pick<Listing, "price" | "priceUnit">): string {
  if (l.priceUnit === "free") return "Free to visit";
  return `From ${inr(l.price)} / ${l.priceUnit}`;
}

export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}
