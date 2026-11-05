"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { saveTripPlan } from "@/app/actions/bookings";
import { Field, StatusMessage, SubmitButton, inputClass, useForm } from "./forms";
import { INTERESTS, MONTHS, buildItinerary, type PlanInput, type PlannerListing } from "@/lib/planner";

export function PlannerForm({ signedIn, listings }: { signedIn: boolean; listings: PlannerListing[] }) {
  const [state, action, pending] = useForm(saveTripPlan);
  const [plan, setPlan] = useState<PlanInput>({ region: "Both", days: 5, travellers: 2, budget: 40000, interests: ["Culture"], travelMonth: MONTHS[new Date().getMonth()] });

  const itinerary = useMemo(() => buildItinerary(plan, listings), [plan, listings]);
  const set = <K extends keyof PlanInput>(k: K, v: PlanInput[K]) => setPlan((p) => ({ ...p, [k]: v }));
  const toggle = (i: string) => set("interests", plan.interests.includes(i) ? plan.interests.filter((x) => x !== i) : [...plan.interests, i]);

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <form action={action} className="space-y-5 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-forest-900/5 sm:p-8">
        <Field label="Region" error={state.fieldErrors?.region}>
          <select name="region" value={plan.region} onChange={(e) => set("region", e.target.value as PlanInput["region"])} className={inputClass}>
            <option>Both</option><option>Garhwal</option><option>Kumaon</option>
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Month" error={state.fieldErrors?.travelMonth}>
            <select name="travelMonth" value={plan.travelMonth} onChange={(e) => set("travelMonth", e.target.value)} className={inputClass}>
              {MONTHS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="Days" error={state.fieldErrors?.days}>
            <input name="days" type="number" min={1} max={30} value={plan.days} onChange={(e) => set("days", Math.min(30, Math.max(1, Number(e.target.value) || 1)))} className={inputClass} />
          </Field>
          <Field label="Travellers" error={state.fieldErrors?.travellers}>
            <input name="travellers" type="number" min={1} max={30} value={plan.travellers} onChange={(e) => set("travellers", Math.min(30, Math.max(1, Number(e.target.value) || 1)))} className={inputClass} />
          </Field>
          <Field label="Total budget (₹)" error={state.fieldErrors?.budget}>
            <input name="budget" type="number" min={0} step={1000} value={plan.budget} onChange={(e) => set("budget", Math.max(0, Number(e.target.value) || 0))} className={inputClass} />
          </Field>
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-forest-800">Interests</legend>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((i) => {
              const on = plan.interests.includes(i);
              return (
                <label key={i} className={`cursor-pointer rounded-full px-4 py-2 text-sm transition ${on ? "bg-forest-800 text-ivory-50" : "bg-ivory-200 text-forest-800"}`}>
                  <input type="checkbox" name="interests" value={i} checked={on} onChange={() => toggle(i)} className="sr-only" />
                  {i}
                </label>
              );
            })}
          </div>
        </fieldset>
        <Field label="Anything else? (optional)">
          <textarea name="notes" rows={3} maxLength={1000} className={inputClass} />
        </Field>
        <StatusMessage state={state} />
        {signedIn ? (
          <SubmitButton pending={pending}>Save this plan</SubmitButton>
        ) : (
          <Link href="/login?next=/trip-planner" className="block rounded-full bg-forest-800 px-6 py-3.5 text-center text-sm text-ivory-50">Sign in to save your plan</Link>
        )}
      </form>

      <div>
        <h2 className="text-3xl font-medium text-forest-900">Your suggested route</h2>
        <p className="mt-2 text-sm text-forest-800/70">A starting point. We refine it with you once you save it.</p>
        <ol className="mt-6 space-y-4">
          {itinerary.length === 0 && <li className="text-forest-800/70">Pick a few interests to see suggestions.</li>}
          {itinerary.map((d) => {
            const l = listings.find((x) => x.kind === d.kind && x.slug === d.slug);
            return (
              <li key={d.day} className="flex gap-4 rounded-2xl bg-ivory-100 p-4">
                <span className="font-display text-3xl text-saffron">{String(d.day).padStart(2, "0")}</span>
                <div>
                  <Link href={`/${d.kind}/${d.slug}`} className="font-display text-xl font-semibold text-forest-900 hover:text-clay">{d.title}</Link>
                  {l && <p className="text-sm text-forest-800/70">{l.location}</p>}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
