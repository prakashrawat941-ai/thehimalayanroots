import Link from "next/link";
import { PageHead, Pill, Table } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { adminDb } from "@/lib/cms/admin-data";

export const metadata = { title: "Audit log" };

interface Row { id: number; actor_id: string | null; actor_role: string | null; action: string; entity: string; entity_id: string; changes: Record<string, unknown>; created_at: string }

const PAGE = 50;

/** Compact, readable summary of a change set. */
function summary(r: Row): string {
  const keys = Object.keys(r.changes ?? {});
  if (r.action === "update") return keys.map((k) => k.replace(/_/g, " ")).join(", ");
  const c = r.changes as Record<string, unknown>;
  return String(c.title ?? c.name ?? c.site_name ?? c.slug ?? c.alt ?? "");
}

export default async function AuditAdmin({ searchParams }: { searchParams: Promise<{ entity?: string; page?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const page = Math.max(0, Number(sp.page) || 0);
  let q = (await adminDb()).from("audit_logs").select("*").order("created_at", { ascending: false }).range(page * PAGE, page * PAGE + PAGE - 1);
  if (sp.entity) q = q.eq("entity", sp.entity);
  const rows = ((await q).data ?? []) as Row[];
  const entities = ["listings", "home_sections", "site_settings", "media", "reviews", "ads", "team_members", "profiles", "bookings", "cab_requests", "contact_messages"];
  const href = (p: number) => `/admin/audit?${new URLSearchParams({ ...(sp.entity && { entity: sp.entity }), page: String(p) })}`;
  return (
    <>
      <PageHead eyebrow="Security" title="Audit log">Every content, role and status change, recorded by the database itself. Entries cannot be edited or deleted.</PageHead>
      <nav className="mb-4 flex flex-wrap gap-2" aria-label="Filter by area">
        <Link href="/admin/audit" className={`rounded-full px-3 py-1.5 text-xs ${!sp.entity ? "bg-forest-800 text-ivory-50" : "bg-ivory-200"}`}>all</Link>
        {entities.map((e) => <Link key={e} href={`/admin/audit?entity=${e}`} className={`rounded-full px-3 py-1.5 text-xs ${sp.entity === e ? "bg-forest-800 text-ivory-50" : "bg-ivory-200"}`}>{e.replace(/_/g, " ")}</Link>)}
      </nav>
      <Table head={["When (IST)", "Action", "Area", "Detail", "By"]} empty={!rows.length}>
        {rows.map((r) => (
          <tr key={r.id} className="align-top">
            <td className="whitespace-nowrap p-3 text-xs">{new Date(r.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "medium" })}</td>
            <td className="p-3"><Pill tone={r.action === "delete" ? "bad" : r.action === "insert" ? "good" : "neutral"}>{r.action}</Pill></td>
            <td className="p-3">{r.entity.replace(/_/g, " ")}</td>
            <td className="max-w-md p-3">
              <details><summary className="cursor-pointer truncate text-forest-900">{summary(r) || r.entity_id}</summary>
                <pre className="mt-2 max-h-64 overflow-auto rounded bg-ivory-100 p-2 text-[11px]">{JSON.stringify(r.changes, null, 2)}</pre></details>
            </td>
            <td className="p-3 text-xs"><span className="capitalize">{r.actor_role ?? "system"}</span>{r.actor_id && <p className="font-mono text-[10px] text-forest-700/70">{r.actor_id.slice(0, 8)}</p>}</td>
          </tr>
        ))}
      </Table>
      <div className="mt-4 flex gap-3 text-sm">
        {page > 0 && <Link href={href(page - 1)} className="underline">← Newer</Link>}
        {rows.length === PAGE && <Link href={href(page + 1)} className="underline">Older →</Link>}
      </div>
    </>
  );
}
