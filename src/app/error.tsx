"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="flex min-h-[80svh] flex-col items-center justify-center bg-forest-950 px-5 text-center">
      <h1 className="text-5xl text-ivory-50">Something went wrong.</h1>
      <p className="mt-3 text-ivory-200">Please try again in a moment.</p>
      <button onClick={reset} className="mt-8 rounded-full bg-saffron px-7 py-3 text-sm font-medium text-forest-950">Try again</button>
    </section>
  );
}
