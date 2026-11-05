import Link from "next/link";
import { setMessageStatus } from "@/app/actions/cms";
import { ConfirmButton } from "@/components/admin/client";
import { PageHead, Pill } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth";
import { adminDb } from "@/lib/cms/admin-data";

export const metadata = { title: "Messages" };

const STATUSES = ["new", "read", "archived"] as const;
interface Row { id: string; name: string; email: string; phone: string | null; subject: string | null; message: string; status: string; created_at: string }

const Btn = ({ id, status, label }: { id: string; status: string; label: string }) => (
  <form action={setMessageStatus}><input type="hidden" name="id" value={id} /><input type="hidden" name="status" value={status} />
    <button className="rounded-full border border-forest-700/30 px-3 py-1.5 text-xs text-forest-800 hover:bg-ivory-200">{label}</button></form>
);

export default async function MessagesAdmin({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const user = await requireStaff();
  const sp = await searchParams;
  const status = STATUSES.find((s) => s === sp.status) ?? "new";
  const { data } = await (await adminDb()).from("contact_messages").select("*").eq("status", status).order("created_at", { ascending: false }).limit(200);
  const rows = (data ?? []) as Row[];
  return (
    <>
      <PageHead eyebrow="Inbox" title="Contact form messages" />
      <nav className="mb-5 flex gap-2" aria-label="Filter">
        {STATUSES.map((s) => <Link key={s} href={`/admin/messages?status=${s}`} className={`rounded-full px-4 py-2 text-sm capitalize ${status === s ? "bg-forest-800 text-ivory-50" : "bg-ivory-200 text-forest-800"}`}>{s}</Link>)}
      </nav>
      <ul className="space-y-3">
        {rows.map((m) => (
          <li key={m.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-forest-900/5">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="font-medium text-forest-900">{m.name}</p>
              <a href={`mailto:${m.email}`} className="text-sm text-forest-700 underline">{m.email}</a>
              {m.phone && <a href={`tel:${m.phone}`} className="text-sm text-forest-700">{m.phone}</a>}
              <span className="ml-auto text-xs text-forest-700">{new Date(m.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })}</span>
            </div>
            {m.subject && <p className="mt-2 text-sm font-medium text-forest-900">{m.subject}</p>}
            <p className="mt-1 whitespace-pre-line text-sm text-forest-800">{m.message}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Pill>{m.status}</Pill>
              {m.status !== "read" && <Btn id={m.id} status="read" label="Mark read" />}
              {m.status !== "archived" && <Btn id={m.id} status="archived" label="Archive" />}
              {m.status !== "new" && <Btn id={m.id} status="new" label="Mark new" />}
              {user.role === "admin" && (
                <form action={setMessageStatus}><input type="hidden" name="id" value={m.id} /><input type="hidden" name="status" value="delete" />
                  <ConfirmButton message="Delete this message permanently?" className="rounded-full px-3 py-1.5 text-xs text-clay hover:bg-clay/10">Delete</ConfirmButton></form>
              )}
            </div>
          </li>
        ))}
        {!rows.length && <li className="rounded-2xl bg-white p-8 text-center text-sm text-forest-800/60">No {status} messages.</li>}
      </ul>
    </>
  );
}
