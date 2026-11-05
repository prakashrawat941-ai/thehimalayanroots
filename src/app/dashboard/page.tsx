import type { Metadata } from "next";
import Link from "next/link";
import { cancelBooking } from "@/app/actions/bookings";
import { signOut } from "@/app/actions/auth";
import { StatusBadge } from "@/components/StatusBadge";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate, inr } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "My dashboard", robots: { index: false } };

interface BookingRow { id: string; listing_kind: string; listing_slug: string; listing_title: string; start_date: string; end_date: string; guests: number; total_inr: number; status: string }
interface PlanRow { id: string; region: string; travel_month: string; days: number; travellers: number; budget_inr: number; itinerary: { day: number; title: string }[]; created_at: string }

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const [{ data: bookings }, { data: plans }] = await Promise.all([
    supabase.from("bookings").select("id, listing_kind, listing_slug, listing_title, start_date, end_date, guests, total_inr, status").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("trip_plans").select("id, region, travel_month, days, travellers, budget_inr, itinerary, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-5 pb-24 pt-36 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-clay">Dashboard</p>
          <h1 className="mt-2 text-5xl font-medium text-forest-900">Namaste{user.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}</h1>
          <p className="mt-1 text-sm text-forest-800/70">{user.email}</p>
        </div>
        <div className="flex gap-3">
          {user.role === "admin" && <Link href="/admin" className="rounded-full bg-forest-800 px-5 py-2.5 text-sm text-ivory-50">Admin panel</Link>}
          <form action={signOut}><button className="rounded-full border border-forest-800 px-5 py-2.5 text-sm text-forest-800">Sign out</button></form>
        </div>
      </div>

      <h2 className="mt-14 text-3xl font-medium text-forest-900">Bookings</h2>
      {!bookings?.length ? (
        <p className="mt-4 rounded-2xl bg-ivory-100 p-6 text-sm text-forest-800">No bookings yet. <Link href="/homestays" className="font-medium text-clay underline">Find a homestay</Link>.</p>
      ) : (
        <ul className="mt-5 space-y-4">
          {(bookings as BookingRow[]).map((b) => (
            <li key={b.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-forest-900/5">
              <div>
                <Link href={`/${b.listing_kind}/${b.listing_slug}`} className="font-display text-2xl font-semibold text-forest-900 hover:text-clay">{b.listing_title}</Link>
                <p className="text-sm text-forest-800/70">{formatDate(b.start_date)}{b.end_date !== b.start_date && ` → ${formatDate(b.end_date)}`} · {b.guests} guest{b.guests > 1 && "s"} · {inr(b.total_inr)}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={b.status} />
                {(b.status === "pending" || b.status === "confirmed") && (
                  <form action={cancelBooking}><input type="hidden" name="id" value={b.id} /><button className="text-sm text-clay underline">Cancel</button></form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-14 text-3xl font-medium text-forest-900">Saved trip plans</h2>
      {!plans?.length ? (
        <p className="mt-4 rounded-2xl bg-ivory-100 p-6 text-sm text-forest-800">Nothing saved. <Link href="/trip-planner" className="font-medium text-clay underline">Plan a trip</Link>.</p>
      ) : (
        <ul className="mt-5 grid gap-4 sm:grid-cols-2">
          {(plans as PlanRow[]).map((p) => (
            <li key={p.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-forest-900/5">
              <p className="font-display text-2xl font-semibold text-forest-900">{p.days} days · {p.region}</p>
              <p className="text-sm text-forest-800/70">{p.travel_month} · {p.travellers} traveller{p.travellers > 1 && "s"} · {inr(p.budget_inr)}</p>
              <ol className="mt-3 list-inside list-decimal text-sm text-forest-800">
                {p.itinerary.map((d) => <li key={d.day}>{d.title}</li>)}
              </ol>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
