import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { adminDb, daysAgoIso, getCounts } from "@/lib/cms/admin-data";
import { Card, PageHead, Stat, Table } from "@/components/admin/ui";
import { inr, formatDate } from "@/lib/format";

export const metadata = { title: "Overview" };

interface BookingRow { listing_title: string; total_inr: number; status: string; created_at: string }
interface AuditRow { id: number; action: string; entity: string; entity_id: string; actor_role: string | null; created_at: string }

export default async function AdminOverview() {
  const user = await requireStaff();
  const db = await adminDb();
  const since = daysAgoIso(30);
  const [n, bookings, audit] = await Promise.all([
    getCounts(),
    user.role === "admin" ? db.from("bookings").select("listing_title, total_inr, status, created_at").gte("created_at", since).limit(1000) : Promise.resolve({ data: [] }),
    user.role === "admin" ? db.from("audit_logs").select("id, action, entity, entity_id, actor_role, created_at").order("created_at", { ascending: false }).limit(8) : Promise.resolve({ data: [] }),
  ]);
  const rows = (bookings.data ?? []) as BookingRow[];
  const value = rows.filter((r) => r.status === "confirmed" || r.status === "completed").reduce((s, r) => s + r.total_inr, 0);
  const top = Object.entries(rows.reduce<Record<string, number>>((a, r) => ((a[r.listing_title] = (a[r.listing_title] ?? 0) + 1), a), {})).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <>
      <PageHead eyebrow="Dashboard" title={`Namaste${user.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}`}>Everything on the website is managed here. Saved changes go live immediately.</PageHead>
      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Published listings" value={n.published} href="/admin/listings?kind=villages" />
        <Stat label="Drafts" value={n.drafts} />
        <Stat label="Reviews to moderate" value={n.pendingReviews} href="/admin/reviews?status=pending" />
        <Stat label="New messages" value={n.newMessages} href="/admin/messages" />
        {user.role === "admin" && <>
          <Stat label="Pending bookings" value={n.pendingBookings} href="/admin/bookings" />
          <Stat label="Pending cab requests" value={n.pendingCabs} href="/admin/bookings#cabs" />
          <Stat label="Registered users" value={n.users} href="/admin/users" />
          <Stat label="Images in library" value={n.media} href="/admin/media" />
        </>}
      </dl>
      {user.role === "admin" && (
        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          <Card title="Last 30 days">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-forest-700">Booking requests</dt><dd className="font-display text-3xl">{rows.length}</dd></div>
              <div><dt className="text-forest-700">Confirmed value</dt><dd className="font-display text-3xl">{inr(value)}</dd></div>
            </dl>
            <h3 className="mt-6 text-xs uppercase tracking-wider text-forest-700">Most requested</h3>
            <ol className="mt-2 space-y-1 text-sm">
              {top.length ? top.map(([t, c]) => <li key={t} className="flex justify-between border-b border-ivory-200 py-1.5"><span>{t}</span><span className="text-forest-700">{c}</span></li>) : <li className="text-forest-800/60">No bookings yet.</li>}
            </ol>
          </Card>
          <Card title="Recent changes">
            <Table head={["When", "What", "By"]} empty={!audit.data?.length}>
              {((audit.data ?? []) as AuditRow[]).map((a) => (
                <tr key={a.id}><td className="p-3 whitespace-nowrap">{formatDate(a.created_at.slice(0, 10))}</td><td className="p-3">{a.action} {a.entity.replace(/_/g, " ")}</td><td className="p-3 capitalize">{a.actor_role ?? "system"}</td></tr>
              ))}
            </Table>
            <Link href="/admin/audit" className="mt-3 inline-block text-sm text-forest-700 underline">Full audit log</Link>
          </Card>
        </div>
      )}
    </>
  );
}
