import Link from "next/link";
import { updateBookingStatus } from "@/app/actions/bookings";
import { updateCabStatus } from "@/app/actions/cms";
import { StatusBadge } from "@/components/StatusBadge";
import { PageHead, Table } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { adminDb } from "@/lib/cms/admin-data";
import { formatDate, inr } from "@/lib/format";

export const metadata = { title: "Bookings" };

const STATUSES = ["pending", "confirmed", "completed", "cancelled"] as const;
interface Row { id: string; listing_kind: string; listing_title: string; start_date: string; guests: number; total_inr: number; status: string; notes: string | null }
interface Cab { id: string; pickup_address: string; drop_address: string; pickup_at: string; passengers: number; vehicle: string; status: string; notes: string | null }

function StatusForm({ action, id, status }: { action: (fd: FormData) => Promise<void>; id: string; status: string }) {
  return (
    <form action={action} className="flex gap-2">
      <input type="hidden" name="id" value={id} />
      <select name="status" defaultValue={status} aria-label="New status" className="rounded-lg border border-ivory-300 px-2 py-1.5 text-sm capitalize">
        {STATUSES.map((s) => <option key={s}>{s}</option>)}
      </select>
      <button className="rounded-lg bg-forest-800 px-3 py-1.5 text-xs text-ivory-50">Save</button>
    </form>
  );
}

export default async function BookingsAdmin({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin();
  const { status } = await searchParams;
  const filter = STATUSES.find((s) => s === status);
  const db = await adminDb();
  let q = db.from("bookings").select("id, listing_kind, listing_title, start_date, guests, total_inr, status, notes").order("created_at", { ascending: false }).limit(200);
  let cq = db.from("cab_requests").select("id, pickup_address, drop_address, pickup_at, passengers, vehicle, status, notes").order("pickup_at", { ascending: true }).limit(200);
  if (filter) { q = q.eq("status", filter); cq = cq.eq("status", filter); }
  const [{ data }, { data: cabs }] = await Promise.all([q, cq]);
  const rows = (data ?? []) as Row[];
  const cabRows = (cabs ?? []) as Cab[];

  return (
    <>
      <PageHead eyebrow="Operations" title="Bookings & cab requests" />
      <nav aria-label="Filter by status" className="mb-5 flex flex-wrap gap-2">
        {[undefined, ...STATUSES].map((s) => (
          <Link key={s ?? "all"} href={s ? `/admin/bookings?status=${s}` : "/admin/bookings"} className={`rounded-full px-4 py-2 text-sm capitalize ${filter === s ? "bg-forest-800 text-ivory-50" : "bg-ivory-200 text-forest-800"}`}>{s ?? "all"}</Link>
        ))}
      </nav>
      <Table head={["Listing", "Date", "Guests", "Total", "Status", "Update"]} empty={!rows.length}>
        {rows.map((r) => (
          <tr key={r.id} className="align-top">
            <td className="p-3"><p className="font-medium text-forest-900">{r.listing_title}</p><p className="text-xs capitalize text-forest-700">{r.listing_kind}</p>{r.notes && <p className="mt-1 max-w-xs text-xs text-forest-800/70">{r.notes}</p>}</td>
            <td className="p-3">{formatDate(r.start_date)}</td><td className="p-3">{r.guests}</td><td className="p-3">{inr(r.total_inr)}</td>
            <td className="p-3"><StatusBadge status={r.status} /></td><td className="p-3"><StatusForm action={updateBookingStatus} id={r.id} status={r.status} /></td>
          </tr>
        ))}
      </Table>
      <h2 id="cabs" className="mb-4 mt-12 font-display text-3xl text-forest-900">Cab requests</h2>
      <Table head={["Route", "Pickup (IST)", "Pax / vehicle", "Status", "Update"]} empty={!cabRows.length}>
        {cabRows.map((c) => (
          <tr key={c.id} className="align-top">
            <td className="max-w-sm p-3"><p className="text-forest-900">{c.pickup_address}</p><p className="text-xs text-forest-700">→ {c.drop_address}</p>{c.notes && <p className="mt-1 text-xs text-forest-800/70">{c.notes}</p>}</td>
            <td className="p-3 whitespace-nowrap">{new Date(c.pickup_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })}</td>
            <td className="p-3 capitalize">{c.passengers} · {c.vehicle}</td>
            <td className="p-3"><StatusBadge status={c.status} /></td><td className="p-3"><StatusForm action={updateCabStatus} id={c.id} status={c.status} /></td>
          </tr>
        ))}
      </Table>
    </>
  );
}
