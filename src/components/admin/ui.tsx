import Link from "next/link";
import type { ReactNode } from "react";

export function PageHead({ eyebrow, title, action, children }: { eyebrow?: string; title: string; action?: { href: string; label: string }; children?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="text-xs uppercase tracking-[0.3em] text-clay">{eyebrow}</p>}
        <h1 className="mt-1 text-4xl font-medium text-forest-900">{title}</h1>
        {children && <div className="mt-2 max-w-2xl text-sm text-forest-800/75">{children}</div>}
      </div>
      {action && <Link href={action.href} className="rounded-full bg-forest-800 px-5 py-2.5 text-sm font-medium text-ivory-50 hover:bg-forest-700">{action.label}</Link>}
    </div>
  );
}

export function Card({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl bg-white p-5 shadow-sm ring-1 ring-forest-900/5 sm:p-6 ${className}`}>
      {title && <h2 className="mb-4 font-display text-2xl font-semibold text-forest-900">{title}</h2>}
      {children}
    </section>
  );
}

export function Stat({ label, value, href }: { label: string; value: string | number; href?: string }) {
  const body = (
    <>
      <dt className="text-xs uppercase tracking-wider text-forest-600">{label}</dt>
      <dd className="mt-1 font-display text-4xl font-semibold text-forest-900">{value}</dd>
    </>
  );
  return href
    ? <Link href={href} className="block rounded-2xl bg-white p-5 shadow-sm ring-1 ring-forest-900/5 transition hover:ring-forest-700/30">{body}</Link>
    : <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-forest-900/5">{body}</div>;
}

export function Table({ head, children, empty, colSpan }: { head: string[]; children: ReactNode; empty?: boolean; colSpan?: number }) {
  return (
    <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-forest-900/5">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-ivory-100 text-xs uppercase tracking-wider text-forest-700">
          <tr>{head.map((h) => <th key={h} className="p-3 font-medium">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-ivory-200">
          {empty ? <tr><td colSpan={colSpan ?? head.length} className="p-8 text-center text-forest-800/60">Nothing here yet.</td></tr> : children}
        </tbody>
      </table>
    </div>
  );
}

export function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "good" | "warn" | "bad" }) {
  const c = { neutral: "bg-ivory-200 text-forest-800", good: "bg-forest-500/15 text-forest-800", warn: "bg-saffron/20 text-forest-950", bad: "bg-clay/15 text-clay" }[tone];
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${c}`}>{children}</span>;
}

export const Saved = ({ show }: { show?: boolean }) =>
  show ? <p role="status" className="mb-6 rounded-xl bg-forest-500/10 px-4 py-3 text-sm text-forest-800">Saved and published.</p> : null;
