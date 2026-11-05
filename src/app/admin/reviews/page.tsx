import Link from "next/link";
import { Star } from "lucide-react";
import { moderateReview } from "@/app/actions/cms";
import { ConfirmButton } from "@/components/admin/client";
import { PageHead, Pill, Saved } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth";
import { adminDb } from "@/lib/cms/admin-data";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Reviews" };

const STATUSES = ["pending", "approved", "rejected"] as const;
interface Row { id: string; name: string; location: string | null; rating: number; title: string | null; body: string; status: string; featured: boolean; user_id: string | null; created_at: string }

const Act = ({ id, action, label, tone = "" }: { id: string; action: string; label: string; tone?: string }) => (
  <form action={moderateReview}><input type="hidden" name="id" value={id} /><input type="hidden" name="action" value={action} />
    <button className={`rounded-full px-3 py-1.5 text-xs ${tone || "border border-forest-700/30 text-forest-800 hover:bg-ivory-200"}`}>{label}</button></form>
);

export default async function ReviewsAdmin({ searchParams }: { searchParams: Promise<{ status?: string; saved?: string }> }) {
  await requireStaff();
  const sp = await searchParams;
  const status = STATUSES.find((s) => s === sp.status);
  let q = (await adminDb()).from("reviews").select("id, name, location, rating, title, body, status, featured, user_id, created_at").order("created_at", { ascending: false }).limit(200);
  if (status) q = q.eq("status", status);
  const rows = ((await q).data ?? []) as Row[];
  return (
    <>
      <PageHead eyebrow="Moderation" title="Customer reviews" action={{ href: "/admin/reviews/new", label: "Add review" }}>
        Travellers submit reviews from the Reviews page; they stay hidden until approved. Featured reviews appear on the homepage.
      </PageHead>
      <Saved show={sp.saved === "1"} />
      <nav className="mb-5 flex flex-wrap gap-2" aria-label="Filter by status">
        {[undefined, ...STATUSES].map((s) => <Link key={s ?? "all"} href={s ? `/admin/reviews?status=${s}` : "/admin/reviews"} className={`rounded-full px-4 py-2 text-sm capitalize ${status === s ? "bg-forest-800 text-ivory-50" : "bg-ivory-200 text-forest-800"}`}>{s ?? "all"}</Link>)}
      </nav>
      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-forest-900/5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex text-saffron" aria-label={`${r.rating} out of 5`}>{Array.from({ length: 5 }, (_, i) => <Star key={i} size={14} className={i < r.rating ? "fill-saffron" : "opacity-30"} />)}</span>
              <Pill tone={r.status === "approved" ? "good" : r.status === "rejected" ? "bad" : "warn"}>{r.status}</Pill>
              {r.featured && <Pill tone="warn">featured</Pill>}
              <span className="text-xs text-forest-700">{r.user_id ? "Submitted by a traveller" : "Added by staff"} · {formatDate(r.created_at.slice(0, 10))}</span>
            </div>
            {r.title && <p className="mt-2 font-medium text-forest-900">{r.title}</p>}
            <p className="mt-1 whitespace-pre-line text-sm text-forest-800">{r.body}</p>
            <p className="mt-2 text-sm text-forest-700">— {r.name}{r.location && `, ${r.location}`}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {r.status !== "approved" && <Act id={r.id} action="approve" label="Approve" tone="bg-forest-800 text-ivory-50" />}
              {r.status !== "rejected" && <Act id={r.id} action="reject" label="Reject" />}
              {r.featured ? <Act id={r.id} action="unfeature" label="Remove from homepage" /> : <Act id={r.id} action="feature" label="Feature on homepage" />}
              <Link href={`/admin/reviews/${r.id}`} className="rounded-full border border-forest-700/30 px-3 py-1.5 text-xs text-forest-800 hover:bg-ivory-200">Edit</Link>
              <form action={moderateReview}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="action" value="delete" />
                <ConfirmButton message="Delete this review?" className="rounded-full px-3 py-1.5 text-xs text-clay hover:bg-clay/10">Delete</ConfirmButton></form>
            </div>
          </li>
        ))}
        {!rows.length && <li className="rounded-2xl bg-white p-8 text-center text-sm text-forest-800/60">No reviews{status ? ` with status “${status}”` : ""}.</li>}
      </ul>
    </>
  );
}
