import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteTeamMember, saveTeamMember } from "@/app/actions/cms";
import { AdminForm, Area, Check, ConfirmButton, MediaPicker, Text } from "@/components/admin/client";
import { Card, PageHead } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth";
import { adminDb, getLibrary } from "@/lib/cms/admin-data";

export const metadata = { title: "Team member" };

interface Row { name: string; role: string; bio: string; photo_media_id: string | null; position: number; enabled: boolean }

export default async function EditTeamMember({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;
  const isNew = id === "new";
  const [res, library] = await Promise.all([
    isNew ? Promise.resolve({ data: null }) : (await adminDb()).from("team_members").select("name, role, bio, photo_media_id, position, enabled").eq("id", id).maybeSingle(),
    getLibrary(),
  ]);
  const t = res.data as Row | null;
  if (!isNew && !t) notFound();
  return (
    <>
      <p className="mb-2 text-sm"><Link href="/admin/about" className="text-forest-700 underline">← Our story & team</Link></p>
      <PageHead eyebrow="Team" title={isNew ? "Add team member" : t!.name} />
      <Card>
        <AdminForm action={saveTeamMember} submitLabel={isNew ? "Add" : "Save"}>
          <input type="hidden" name="id" value={id} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Text label="Name" name="name" defaultValue={t?.name} required maxLength={120} />
            <Text label="Role" name="role" defaultValue={t?.role} maxLength={120} />
            <Text label="Order" name="position" type="number" min={0} defaultValue={t?.position ?? 0} />
          </div>
          <Area label="Short bio" name="bio" defaultValue={t?.bio} rows={4} maxLength={1000} />
          <MediaPicker name="photoMediaId" label="Photo" library={library} value={t?.photo_media_id} />
          <Check name="enabled" label="Show on About page" defaultChecked={t?.enabled ?? true} />
        </AdminForm>
      </Card>
      {!isNew && <form action={deleteTeamMember} className="mt-6"><input type="hidden" name="id" value={id} /><ConfirmButton>Remove team member</ConfirmButton></form>}
    </>
  );
}
