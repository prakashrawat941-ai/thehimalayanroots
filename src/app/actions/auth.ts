"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, siteUrl } from "@/lib/supabase/config";
import { safeNext, signInSchema, signUpSchema } from "@/lib/validation";

export interface FormState {
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

const NOT_CONFIGURED: FormState = { error: "Accounts are not available yet: Supabase is not configured." };

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  // Deliberately generic: do not reveal whether the email exists.
  if (error) return { error: "Incorrect email or password." };

  revalidatePath("/", "layout");
  redirect(safeNext(formData.get("next")));
}

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  });
  if (error) return { error: "We couldn't create that account. Try a different email or a stronger password." };

  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/dashboard");
  }
  return { message: "Check your email to confirm your account, then sign in." };
}

export async function signOut() {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  revalidatePath("/", "layout");
  redirect("/");
}
