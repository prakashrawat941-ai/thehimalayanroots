import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { AuthShell } from "@/components/AuthShell";
import { getSessionUser } from "@/lib/auth";
import { safeNext } from "@/lib/validation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  const target = safeNext(next);
  if (await getSessionUser()) redirect(target);
  return (
    <AuthShell title="Welcome back" subtitle="Sign in to manage bookings and saved plans.">
      {error === "callback" && <p role="alert" className="mb-5 rounded-xl bg-clay/10 px-4 py-3 text-sm text-clay">That confirmation link is invalid or has expired.</p>}
      <AuthForm mode="login" next={target} />
    </AuthShell>
  );
}
