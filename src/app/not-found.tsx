import Link from "next/link";

export default function NotFound() {
  return (
    <section className="flex min-h-[80svh] flex-col items-center justify-center bg-forest-950 px-5 text-center">
      <p className="text-xs uppercase tracking-[0.35em] text-saffron">404</p>
      <h1 className="mt-4 text-5xl text-ivory-50">This trail ends here.</h1>
      <Link href="/" className="mt-8 rounded-full bg-saffron px-7 py-3 text-sm font-medium text-forest-950">Back to base camp</Link>
    </section>
  );
}
