"use client";
import Link from "next/link";
import { signIn, signUp } from "@/app/actions/auth";
import { Field, StatusMessage, SubmitButton, inputClass, useForm } from "./forms";

export function AuthForm({ mode, next }: { mode: "login" | "signup"; next?: string }) {
  const [state, action, pending] = useForm(mode === "login" ? signIn : signUp);
  return (
    <form action={action} className="space-y-5" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      {mode === "signup" && (
        <Field label="Full name" error={state.fieldErrors?.fullName}>
          <input name="fullName" autoComplete="name" required maxLength={120} className={inputClass} />
        </Field>
      )}
      <Field label="Email" error={state.fieldErrors?.email}>
        <input name="email" type="email" autoComplete="email" required maxLength={254} className={inputClass} />
      </Field>
      <Field label="Password" error={state.fieldErrors?.password}>
        <input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={mode === "signup" ? 10 : 1} maxLength={128} className={inputClass} />
      </Field>
      <StatusMessage state={state} />
      <SubmitButton pending={pending}>{mode === "login" ? "Sign in" : "Create account"}</SubmitButton>
      <p className="text-center text-sm text-forest-800/80">
        {mode === "login" ? (
          <>New here? <Link href="/signup" className="font-medium text-clay underline">Create an account</Link></>
        ) : (
          <>Already registered? <Link href="/login" className="font-medium text-clay underline">Sign in</Link></>
        )}
      </p>
    </form>
  );
}
