import type { Metadata } from "next";
import { AdminNav } from "@/components/admin/client";
import { requireStaff } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getCounts } from "@/lib/cms/admin-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin" }, robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff();
  const n = await getCounts();
  const admin = user.role === "admin";
  const links = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/home", label: "Homepage" },
    { href: "/admin/listings?kind=villages", label: "Destinations" },
    { href: "/admin/listings?kind=homestays", label: "Homestays" },
    { href: "/admin/listings?kind=experiences", label: "Experiences" },
    { href: "/admin/listings?kind=trekking", label: "Treks" },
    { href: "/admin/listings?kind=workation", label: "Workations" },
    { href: "/admin/media", label: "Media library" },
    { href: "/admin/reviews", label: "Reviews", badge: n.pendingReviews },
    { href: "/admin/ads", label: "Advertisements" },
    { href: "/admin/about", label: "Our story & team" },
    { href: "/admin/messages", label: "Messages", badge: n.newMessages },
    { href: "/admin/settings", label: "Branding & contact" },
    ...(admin ? [
      { href: "/admin/bookings", label: "Bookings & cabs", badge: n.pendingBookings + n.pendingCabs },
      { href: "/admin/users", label: "Users & hosts" },
      { href: "/admin/audit", label: "Audit log" },
    ] : []),
  ];
  return (
    <div className="min-h-screen bg-ivory-50">
      {/* Dark band so the site header stays legible above the admin. */}
      <div className="h-24 bg-forest-950" />
      {!isSupabaseConfigured && <p className="bg-clay px-5 py-2 text-center text-sm text-ivory-50">Supabase is not configured: the CMS is read-only.</p>}
      <div className="mx-auto grid max-w-[90rem] gap-6 px-4 py-6 lg:grid-cols-[14rem_1fr] lg:px-8">
        <aside className="lg:sticky lg:top-6 lg:h-fit">
          <p className="mb-3 hidden px-3 text-xs uppercase tracking-[0.3em] text-clay lg:block">{admin ? "Admin" : "Editor"}</p>
          <AdminNav links={links} />
        </aside>
        <div className="min-w-0 pb-16">{children}</div>
      </div>
    </div>
  );
}
