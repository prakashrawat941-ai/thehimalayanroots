"use client";
import { useActionState, type ReactNode } from "react";
import type { FormState } from "@/app/actions/auth";

export const inputClass =
  "w-full rounded-xl border border-ivory-300 bg-white px-4 py-3 text-sm text-forest-950 outline-none transition focus:border-forest-600 focus:ring-2 focus:ring-forest-600/20";

export function Field({ label, error, children }: { label: string; error?: string[]; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-forest-800">{label}</span>
      {children}
      {error?.[0] && <span role="alert" className="mt-1 block text-xs text-clay">{error[0]}</span>}
    </label>
  );
}

export function SubmitButton({ pending, children }: { pending: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-forest-800 px-6 py-3.5 text-sm font-medium text-ivory-50 transition hover:bg-forest-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Please wait…" : children}
    </button>
  );
}

export function StatusMessage({ state }: { state: FormState }) {
  if (state.error) return <p role="alert" className="rounded-xl bg-clay/10 px-4 py-3 text-sm text-clay">{state.error}</p>;
  if (state.message) return <p role="status" className="rounded-xl bg-forest-500/10 px-4 py-3 text-sm text-forest-800">{state.message}</p>;
  return null;
}

/** Thin wrapper around useActionState so forms stay declarative. */
export function useForm(action: (prev: FormState, fd: FormData) => Promise<FormState>) {
  return useActionState(action, {} as FormState);
}
