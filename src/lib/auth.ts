import "server-only";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "./supabase/config";
import { createClient } from "./supabase/server";

export type Role = "user" | "host" | "editor" | "admin";
export const ROLES: Role[] = ["user", "host", "editor", "admin"];

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("full_name, role").eq("id", user.id).maybeSingle();
  return {
    id: user.id,
    email: user.email ?? "",
    fullName: profile?.full_name ?? "",
    role: ROLES.includes(profile?.role as Role) ? (profile!.role as Role) : "user",
  };
}

export async function requireUser(next = "/dashboard"): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

/** Editors and admins: content management. */
export const isStaff = (u: SessionUser | null) => u?.role === "editor" || u?.role === "admin";

export async function requireStaff(): Promise<SessionUser> {
  const user = await requireUser("/admin");
  if (!isStaff(user)) redirect("/dashboard");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser("/admin");
  if (user.role !== "admin") redirect("/dashboard");
  return user;
}
