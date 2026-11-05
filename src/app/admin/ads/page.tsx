import Image from "next/image";
import Link from "next/link";
import { PageHead, Pill, Saved, Table } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth";
import { adminDb, nowMs } from "@/lib/cms/admin-data";
import { MEDIA_COLUMNS, toMedia, type MediaRow } from "@/lib/cms/queries";

export const metadata = { title: "Advertisements" };

interface Row { id: string; title: string; url: string; placement: string; starts_at: string | null; ends_at: string | null; enabled: boolean; media: MediaRow | null }

const ist = (iso: string | null) => (iso ? new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }) : "—");

export default async function AdsAdmin({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  await requireStaff();
  const { saved } = await searchParams;
  const { data } = await (await adminDb()).from("ads").select(`id, title, url, placement, starts_at, ends_at, enabled, media:media!ads_media_id_fkey(${MEDIA_COLUMNS})`).order("placement").order("position");
  const rows = (data ?? []) as unknown as Row[];
  const now = nowMs();
  const state = (r: Row) =>
    !r.enabled ? ["off", "neutral"] as const :
    r.starts_at && Date.parse(r.starts_at) > now ? ["scheduled", "warn"] as const :
    r.ends_at && Date.parse(r.ends_at) <= now ? ["expired", "bad"] as const : ["live", "good"] as const;
  return (
    <>
      <PageHead eyebrow="Marketing" title="Advertisements" action={{ href: "/admin/ads/new", label: "Add advertisement" }}>
        Homepage ads show in the &ldquo;Advertisement slot&rdquo; section matching their placement. Sidebar ads show on listing pages.
      </PageHead>
      <Saved show={saved === "1"} />
      <Table head={["", "Advertisement", "Placement", "Schedule (IST)", "Status"]} empty={!rows.length}>
        {rows.map((r) => { const m = toMedia(r.media); const [label, tone] = state(r); return (
          <tr key={r.id}>
            <td className="w-24 p-3"><span className="relative block h-12 w-20 overflow-hidden rounded bg-ivory-200">{m && <Image src={m.src} alt="" fill sizes="80px" className="object-cover" />}</span></td>
            <td className="p-3"><Link href={`/admin/ads/${r.id}`} className="font-medium text-forest-900 hover:underline">{r.title}</Link><p className="max-w-xs truncate text-xs text-forest-700">{r.url}</p></td>
            <td className="p-3">{r.placement.replace("_", " ")}</td>
            <td className="p-3 text-xs">{ist(r.starts_at)} → {ist(r.ends_at)}</td>
            <td className="p-3"><Pill tone={tone}>{label}</Pill></td>
          </tr>); })}
      </Table>
    </>
  );
}
