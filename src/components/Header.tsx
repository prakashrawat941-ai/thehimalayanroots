import Image from "next/image";
import Link from "next/link";
import { MobileNav } from "./MobileNav";
import { NAV_LINKS } from "./nav";
import { getSettings } from "@/lib/cms/queries";

/** Text logo with the last word in gold, e.g. "The Himalayan <Roots>". */
export function Wordmark({ name }: { name: string }) {
  const i = name.lastIndexOf(" ");
  return i > 0 ? <>{name.slice(0, i)} <span className="text-saffron">{name.slice(i + 1)}</span></> : <>{name}</>;
}

export async function Header() {
  const { siteName, logo } = await getSettings();
  return (
    <header className="absolute inset-x-0 top-0 z-40">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
        <Link href="/" className="font-display text-2xl font-semibold tracking-wide text-ivory-50" aria-label={`${siteName} home`}>
          {logo ? (
            <Image src={logo.src} alt={siteName} width={Math.round((logo.width / logo.height) * 44)} height={44} preload className="h-11 w-auto" />
          ) : (
            <Wordmark name={siteName} />
          )}
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-7 text-sm text-ivory-100 lg:flex">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="transition hover:text-saffron">{l.label}</Link>
          ))}
          <Link href="/dashboard" className="rounded-full border border-ivory-100/50 px-4 py-1.5 transition hover:bg-ivory-50 hover:text-forest-900">
            Account
          </Link>
        </nav>
        <MobileNav />
      </div>
    </header>
  );
}
