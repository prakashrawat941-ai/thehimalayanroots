import { saveSettings } from "@/app/actions/cms";
import { AdminForm, Area, MediaPicker, Text } from "@/components/admin/client";
import { Card, PageHead } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth";
import { adminDb, getLibrary } from "@/lib/cms/admin-data";
import { COLOR_KEYS, SOCIAL_KEYS, type Contact } from "@/lib/cms/types";

export const metadata = { title: "Branding & contact" };

// Current built-in palette, shown as placeholders.
const BASE: Record<string, string> = {
  "forest-950": "#0b1f16", "forest-900": "#102a1d", "forest-800": "#17402c", "forest-700": "#1f5a3d",
  "ivory-50": "#fdfbf5", "ivory-100": "#f8f3e6", saffron: "#c8842c", clay: "#9a4b2e",
};
const COLOR_LABEL: Record<string, string> = {
  "forest-950": "Darkest green (footer, hero)", "forest-900": "Headings", "forest-800": "Buttons", "forest-700": "Links",
  "ivory-50": "Page background", "ivory-100": "Section background", saffron: "Gold accent", clay: "Clay accent",
};

interface Row { site_name: string; tagline: string; description: string; footer_note: string; logo_media_id: string | null; favicon_media_id: string | null; colors: Record<string, string>; social: Record<string, string>; contact: Contact }

export default async function SettingsAdmin() {
  await requireStaff();
  const [{ data }, library] = await Promise.all([(await adminDb()).from("site_settings").select("*").eq("id", 1).maybeSingle(), getLibrary()]);
  const s = (data ?? {}) as Partial<Row>;
  const c = s.contact ?? {};
  return (
    <>
      <PageHead eyebrow="Website" title="Branding & contact">Changes apply across the whole website as soon as you save.</PageHead>
      <AdminForm action={saveSettings} submitLabel="Save & publish" className="space-y-6">
        <Card title="Identity">
          <div className="grid gap-4 sm:grid-cols-2">
            <Text label="Website name" name="siteName" defaultValue={s.site_name ?? "The Himalayan Roots"} required maxLength={80} hint="The last word is shown in gold in the header" />
            <Text label="Tagline" name="tagline" defaultValue={s.tagline} maxLength={200} />
            <Area label="Search engine description" name="description" defaultValue={s.description} rows={2} maxLength={300} className="sm:col-span-2" />
            <Area label="Footer note" name="footerNote" defaultValue={s.footer_note} rows={2} maxLength={300} className="sm:col-span-2" />
            <MediaPicker name="logoMediaId" label="Logo (optional)" library={library} value={s.logo_media_id} hint="Replaces the text logo. Use a light-coloured logo on a transparent background." />
            <MediaPicker name="faviconMediaId" label="Favicon" library={library} value={s.favicon_media_id} hint="Square image, at least 512×512" />
          </div>
        </Card>
        <Card title="Brand colours">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {COLOR_KEYS.map((k) => (
              <Text key={k} label={COLOR_LABEL[k]} name={`color.${k}`} defaultValue={s.colors?.[k] ?? ""} placeholder={BASE[k]} pattern="#[0-9a-fA-F]{6}" hint={`Default ${BASE[k]}`} />
            ))}
          </div>
          <p className="mt-3 text-xs text-forest-800/60">Leave blank to keep the default. Keep enough contrast between text and background colours.</p>
        </Card>
        <Card title="Contact details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Text label="Email" name="contact.email" type="email" defaultValue={c.email} />
            <Text label="Phone" name="contact.phone" defaultValue={c.phone} maxLength={20} />
            <Text label="WhatsApp number" name="contact.whatsapp" defaultValue={c.whatsapp} maxLength={20} />
            <Text label="Office hours" name="contact.hours" defaultValue={c.hours} maxLength={160} />
            <Area label="Address" name="contact.address" defaultValue={c.address} rows={2} maxLength={400} />
            <Text label="Map link" name="contact.mapUrl" defaultValue={c.mapUrl} placeholder="https://maps.google.com/…" />
          </div>
        </Card>
        <Card title="Social media">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SOCIAL_KEYS.map((k) => <Text key={k} label={k === "x" ? "X (Twitter)" : k} name={`social.${k}`} defaultValue={s.social?.[k] ?? ""} placeholder="https://…" />)}
          </div>
        </Card>
      </AdminForm>
    </>
  );
}
