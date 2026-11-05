import { setUserRole } from "@/app/actions/cms";
import { PageHead, Table } from "@/components/admin/ui";
import { ROLES, requireAdmin } from "@/lib/auth";
import { adminDb } from "@/lib/cms/admin-data";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Users & hosts" };

interface Row { id: string; full_name: string; phone: string | null; role: string; created_at: string }

const ROLE_HELP = "User: books and reviews. Host: linked to the listings they run. Editor: manages all content. Admin: everything, including users, bookings and the audit log.";

export default async function UsersAdmin({ searchParams }: { searchParams: Promise<{ q?: string; role?: string }> }) {
  const me = await requireAdmin();
  const sp = await searchParams;
  let q = (await adminDb()).from("profiles").select("id, full_name, phone, role, created_at").order("created_at", { ascending: false }).limit(300);
  if (sp.role && ROLES.includes(sp.role as (typeof ROLES)[number])) q = q.eq("role", sp.role);
  if (sp.q) q = q.ilike("full_name", `%${sp.q.replace(/[%_\\]/g, "")}%`);
  const rows = ((await q).data ?? []) as Row[];
  return (
    <>
      <PageHead eyebrow="Access" title="Users & hosts">{ROLE_HELP}</PageHead>
      <form className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={sp.q} placeholder="Search by name…" className="rounded-lg border border-ivory-300 bg-white px-3 py-2 text-sm" />
        <select name="role" defaultValue={sp.role ?? ""} className="rounded-lg border border-ivory-300 bg-white px-3 py-2 text-sm"><option value="">All roles</option>{ROLES.map((r) => <option key={r}>{r}</option>)}</select>
        <button className="rounded-full bg-forest-800 px-4 py-2 text-sm text-ivory-50">Filter</button>
      </form>
      <Table head={["Name", "Phone", "Joined", "Role"]} empty={!rows.length}>
        {rows.map((u) => (
          <tr key={u.id}>
            <td className="p-3"><p className="font-medium text-forest-900">{u.full_name || "—"}</p><p className="font-mono text-[11px] text-forest-700/70">{u.id}</p></td>
            <td className="p-3">{u.phone ?? "—"}</td>
            <td className="p-3">{formatDate(u.created_at.slice(0, 10))}</td>
            <td className="p-3">
              {u.id === me.id ? <span className="text-sm capitalize">{u.role} (you)</span> : (
                <form action={setUserRole} className="flex gap-2">
                  <input type="hidden" name="id" value={u.id} />
                  <select name="role" defaultValue={u.role} aria-label={`Role for ${u.full_name || u.id}`} className="rounded-lg border border-ivory-300 px-2 py-1.5 text-sm capitalize">{ROLES.map((r) => <option key={r}>{r}</option>)}</select>
                  <button className="rounded-lg bg-forest-800 px-3 py-1.5 text-xs text-ivory-50">Save</button>
                </form>
              )}
            </td>
          </tr>
        ))}
      </Table>
    </>
  );
}
