import { Landscape } from "./Landscape";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="relative isolate flex min-h-[100svh] items-center justify-center px-5 py-32">
      <Landscape seed="auth" palette="pine" className="absolute inset-0 -z-10 h-full w-full" />
      <div className="absolute inset-0 -z-10 bg-forest-950/50" />
      <div className="w-full max-w-md rounded-3xl bg-ivory-50 p-8 shadow-2xl">
        <h1 className="text-4xl font-semibold text-forest-900">{title}</h1>
        <p className="mb-7 mt-2 text-sm text-forest-800/70">{subtitle}</p>
        {!isSupabaseConfigured && (
          <p className="mb-5 rounded-xl bg-saffron/15 px-4 py-3 text-sm text-forest-900">
            Supabase isn&apos;t configured. Copy <code>.env.example</code> to <code>.env.local</code> and add your project keys.
          </p>
        )}
        {children}
      </div>
    </section>
  );
}
