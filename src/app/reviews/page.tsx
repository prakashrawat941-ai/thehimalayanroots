import type { Metadata } from "next";
import Image from "next/image";
import { Star } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { ReviewForm } from "@/components/PublicForms";
import { getSessionUser } from "@/lib/auth";
import { getReviews } from "@/lib/cms/queries";

export const metadata: Metadata = { title: "Traveller reviews", description: "What travellers say about their stays, treks and village experiences." };

export default async function ReviewsPage() {
  const [reviews, user] = await Promise.all([getReviews({ limit: 60 }), getSessionUser()]);
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  return (
    <>
      <PageHero eyebrow="Reviews" title="Words from the trail" intro={reviews.length ? `${avg.toFixed(1)} out of 5 from ${reviews.length} traveller review${reviews.length > 1 ? "s" : ""}.` : "Be the first to share your experience."} seed="reviews" palette="meadow" />
      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-16 lg:grid-cols-[1.5fr_1fr] lg:px-8">
        <ul className="space-y-5">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-forest-900/5">
              <span className="flex text-saffron" aria-label={`${r.rating} out of 5 stars`}>{Array.from({ length: 5 }, (_, k) => <Star key={k} size={15} className={k < r.rating ? "fill-saffron" : "opacity-25"} />)}</span>
              {r.title && <p className="mt-3 font-display text-2xl text-forest-900">{r.title}</p>}
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-forest-800/85">{r.body}</p>
              <p className="mt-4 flex items-center gap-3 text-sm">
                {r.photo && <span className="relative h-9 w-9 overflow-hidden rounded-full"><Image src={r.photo.src} alt="" fill sizes="36px" className="object-cover" /></span>}
                <span className="font-medium text-forest-900">{r.name}</span>{r.location && <span className="text-forest-700">· {r.location}</span>}
              </p>
            </li>
          ))}
          {!reviews.length && <li className="text-forest-800/70">No reviews yet.</li>}
        </ul>
        <div className="h-fit rounded-3xl bg-white p-6 shadow-sm ring-1 ring-forest-900/5 lg:sticky lg:top-8">
          <h2 className="mb-5 font-display text-3xl text-forest-900">Share your experience</h2>
          <ReviewForm signedIn={Boolean(user)} defaultName={user?.fullName} />
        </div>
      </section>
    </>
  );
}
