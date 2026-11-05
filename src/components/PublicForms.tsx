"use client";
import { useState } from "react";
import { Star } from "lucide-react";
import { submitContact, submitReview } from "@/app/actions/cms";
import { Field, StatusMessage, SubmitButton, inputClass, useForm } from "./forms";

export function ContactForm() {
  const [state, action, pending] = useForm(submitContact);
  if (state.message) return <StatusMessage state={state} />;
  return (
    <form action={action} className="space-y-4">
      {/* Honeypot: hidden from people, filled in by bots. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" error={state.fieldErrors?.name}><input name="name" required maxLength={120} autoComplete="name" className={inputClass} /></Field>
        <Field label="Email" error={state.fieldErrors?.email}><input name="email" type="email" required maxLength={254} autoComplete="email" className={inputClass} /></Field>
        <Field label="Phone (optional)" error={state.fieldErrors?.phone}><input name="phone" type="tel" maxLength={20} autoComplete="tel" className={inputClass} /></Field>
        <Field label="Subject (optional)" error={state.fieldErrors?.subject}><input name="subject" maxLength={160} className={inputClass} /></Field>
      </div>
      <Field label="Message" error={state.fieldErrors?.message}><textarea name="message" rows={5} required minLength={10} maxLength={4000} className={inputClass} /></Field>
      <StatusMessage state={state} />
      <SubmitButton pending={pending}>Send message</SubmitButton>
    </form>
  );
}

export function ReviewForm({ signedIn, defaultName }: { signedIn: boolean; defaultName?: string }) {
  const [state, action, pending] = useForm(submitReview);
  const [rating, setRating] = useState(0);
  if (!signedIn) {
    return (
      <div className="rounded-2xl bg-ivory-100 p-6 text-center">
        <p className="text-sm text-forest-800">Travelled with us? Sign in to share your experience.</p>
        <a href="/login?next=/reviews" className="mt-4 inline-block rounded-full bg-forest-800 px-6 py-3 text-sm text-ivory-50">Sign in</a>
      </div>
    );
  }
  if (state.message) return <StatusMessage state={state} />;
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="rating" value={rating || ""} />
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-forest-800">Your rating</legend>
        <div className="flex gap-1" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setRating(n)} className="rounded p-1">
              <Star size={28} className={n <= rating ? "fill-saffron text-saffron" : "text-forest-800/30"} />
            </button>
          ))}
        </div>
        {state.fieldErrors?.rating?.[0] && <span role="alert" className="mt-1 block text-xs text-clay">{state.fieldErrors.rating[0]}</span>}
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name to show" error={state.fieldErrors?.name}><input name="name" defaultValue={defaultName} required maxLength={120} className={inputClass} /></Field>
        <Field label="From (optional)" error={state.fieldErrors?.location}><input name="location" maxLength={120} placeholder="City, country" className={inputClass} /></Field>
      </div>
      <Field label="Title (optional)" error={state.fieldErrors?.title}><input name="title" maxLength={160} className={inputClass} /></Field>
      <Field label="Your review" error={state.fieldErrors?.body}><textarea name="body" rows={5} required minLength={10} maxLength={2000} className={inputClass} /></Field>
      <StatusMessage state={state} />
      <SubmitButton pending={pending}>Submit review</SubmitButton>
      <p className="text-center text-xs text-forest-800/60">Reviews are checked by our team before they appear.</p>
    </form>
  );
}
