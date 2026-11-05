import Link from "next/link";
import { notFound } from "next/navigation";
import { saveReview } from "@/app/actions/cms";
import { AdminForm, Area, Check, MediaPicker, Select, Text } from "@/components/admin/client";
import { Card, PageHead } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth";
import { adminDb, getLibrary } from "@/lib/cms/admin-data";

export const metadata = { title: "Edit review" };

interface Row { name: string; location: string | null; rating: number; title: string | null; body: string; status: string; featured: boolean; photo_media_id: string | null }

export default async function EditReview({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;
  const isNew = id === "new";
  const [res, library] = await Promise.all([
    isNew ? Promise.resolve({ data: null }) : (await adminDb()).from("reviews").select("name, location, rating, title, body, status, featured, photo_media_id").eq("id", id).maybeSingle(),
    getLibrary(),
  ]);
  const r = res.data as Row | null;
  if (!isNew && !r) notFound();
  return (
    <>
      <p className="mb-2 text-sm"><Link href="/admin/reviews" className="text-forest-700 underline">← Reviews</Link></p>
      <PageHead eyebrow="Reviews" title={isNew ? "Add review" : "Edit review"}>Only add reviews customers actually gave you, with their permission.</PageHead>
      <Card>
        <AdminForm action={saveReview} submitLabel={isNew ? "Add review" : "Save"}>
          <input type="hidden" name="id" value={id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Text label="Customer name" name="name" defaultValue={r?.name} required maxLength={120} />
            <Text label="From (city / country)" name="location" defaultValue={r?.location ?? ""} maxLength={120} />
            <Select label="Rating" name="rating" defaultValue={String(r?.rating ?? 5)} options={[["5", "★★★★★ 5"], ["4", "★★★★ 4"], ["3", "★★★ 3"], ["2", "★★ 2"], ["1", "★ 1"]]} />
            <Select label="Status" name="status" defaultValue={r?.status ?? "approved"} options={["pending", "approved", "rejected"]} />
            <Text label="Title" name="title" defaultValue={r?.title ?? ""} maxLength={160} className="sm:col-span-2" />
            <Area label="Review" name="body" defaultValue={r?.body} rows={5} required maxLength={2000} className="sm:col-span-2" />
          </div>
          <MediaPicker name="photoMediaId" label="Customer photo (optional)" library={library} value={r?.photo_media_id} />
          <Check name="featured" label="Feature on homepage (approved reviews only)" defaultChecked={r?.featured} />
        </AdminForm>
      </Card>
    </>
  );
}
