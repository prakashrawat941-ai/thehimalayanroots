import Image from "next/image";
import Link from "next/link";
import { PageHead, Pill, Table } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth";
import { getAdminListings } from "@/lib/cms/admin-data";
import { KIND_TITLE } from "@/lib/cms/kinds";
import { formatPrice } from "@/lib/format";
import type { ListingKind } from "@/lib/data/types";

export const metadata = { title: "Listings" };

export default async function ListingsAdmin({ searchParams }: { searchParams: Promise<{ kind?: string; q?: string }> }) {
  await requireStaff();
  const sp = await searchParams;
  const kind = (Object.keys(KIND_TITLE).find((k) => k === sp.kind) ?? "villages") as ListingKind;
  const q = (sp.q ?? "").trim().toLowerCase();
  const all = await getAdminListings(kind);
  const rows = q ? all.filter((l) => `${l.title} ${l.location} ${l.district ?? ""}`.toLowerCase().includes(q)) : all;
  const [title, noun] = KIND_TITLE[kind];
  return (
    <>
      <PageHead eyebrow="Listings" title={title} action={{ href: `/admin/listings/new?kind=${kind}`, label: `Add ${noun}` }}>
        Drafts are only visible here. Publish to show them on the website.
      </PageHead>
      <form className="mb-4">
        <input type="hidden" name="kind" value={kind} />
        <input name="q" defaultValue={sp.q} placeholder={`Search ${title.toLowerCase()}…`} className="w-full max-w-sm rounded-lg border border-ivory-300 bg-white px-3 py-2 text-sm" />
      </form>
      <Table head={["", "Name", "Region", "Price", "Status", "Order"]} empty={!rows.length}>
        {rows.map((l) => (
          <tr key={l.id}>
            <td className="w-20 p-3">
              <span className="relative block h-12 w-16 overflow-hidden rounded bg-ivory-200">{l.cover && <Image src={l.cover.src} alt="" fill sizes="64px" className="object-cover" />}</span>
            </td>
            <td className="p-3"><Link href={`/admin/listings/${l.id}`} className="font-medium text-forest-900 hover:underline">{l.title}</Link><p className="text-xs text-forest-700">{l.location}</p></td>
            <td className="p-3">{l.region}</td>
            <td className="p-3">{formatPrice(l)}</td>
            <td className="space-x-1 p-3"><Pill tone={l.status === "published" ? "good" : "neutral"}>{l.status}</Pill>{l.featured && <Pill tone="warn">featured</Pill>}</td>
            <td className="p-3">{l.position}</td>
          </tr>
        ))}
      </Table>
    </>
  );
}
