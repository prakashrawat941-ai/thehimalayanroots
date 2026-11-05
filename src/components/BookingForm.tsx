"use client";
import { useMemo, useState } from "react";
import { createBooking } from "@/app/actions/bookings";
import { Field, StatusMessage, SubmitButton, inputClass, useForm } from "./forms";
import { inr } from "@/lib/format";
import { nightsBetween } from "@/lib/validation";
import type { Listing } from "@/lib/data/types";

export function BookingForm({ listing, signedIn }: { listing: Listing; signedIn: boolean }) {
  const [state, action, pending] = useForm(createBooking);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [guests, setGuests] = useState(2);
  const perNight = listing.priceUnit === "night";
  const max = listing.homestay?.maxGuests ?? 30;
  const today = new Date().toISOString().slice(0, 10);

  // Display-only estimate; the server recomputes the real total.
  const estimate = useMemo(() => {
    if (!start) return null;
    if (perNight) return end >= start ? listing.price * nightsBetween(start, end) : null;
    return listing.price * guests;
  }, [start, end, guests, perNight, listing.price]);

  if (!signedIn) {
    return (
      <div className="rounded-2xl bg-ivory-100 p-6 text-center">
        <p className="text-sm text-forest-800">Sign in to request a booking.</p>
        <a href={`/login?next=${encodeURIComponent(`/${listing.kind}/${listing.slug}`)}`} className="mt-4 inline-block rounded-full bg-forest-800 px-6 py-3 text-sm text-ivory-50">
          Sign in
        </a>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="kind" value={listing.kind} />
      <input type="hidden" name="slug" value={listing.slug} />
      <Field label={perNight ? "Check-in" : "Date"} error={state.fieldErrors?.startDate}>
        <input type="date" name="startDate" min={today} required value={start} onChange={(e) => { setStart(e.target.value); if (!end || end < e.target.value) setEnd(e.target.value); }} className={inputClass} />
      </Field>
      {perNight && (
        <Field label="Check-out" error={state.fieldErrors?.endDate}>
          <input type="date" name="endDate" min={start || today} required value={end} onChange={(e) => setEnd(e.target.value)} className={inputClass} />
        </Field>
      )}
      <Field label="Guests" error={state.fieldErrors?.guests}>
        <input type="number" name="guests" min={1} max={max} required value={guests} onChange={(e) => setGuests(Number(e.target.value) || 1)} className={inputClass} />
      </Field>
      <Field label="Notes (optional)" error={state.fieldErrors?.notes}>
        <textarea name="notes" rows={3} maxLength={1000} className={inputClass} />
      </Field>
      {estimate !== null && (
        <p className="flex justify-between border-t border-ivory-300 pt-4 text-sm">
          <span>Estimated total</span><strong className="font-display text-xl">{inr(estimate)}</strong>
        </p>
      )}
      <StatusMessage state={state} />
      <SubmitButton pending={pending}>Request booking</SubmitButton>
      <p className="text-center text-xs text-forest-800/60">No payment now. We confirm availability first.</p>
    </form>
  );
}
