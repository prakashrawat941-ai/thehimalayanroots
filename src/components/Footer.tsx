import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { NAV_LINKS } from "./nav";
import { Wordmark } from "./Header";
import { getSettings } from "@/lib/cms/queries";
import { SOCIAL_KEYS } from "@/lib/cms/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const SOCIAL_LABEL: Record<string, string> = { instagram: "Instagram", facebook: "Facebook", youtube: "YouTube", x: "X", linkedin: "LinkedIn", whatsapp: "WhatsApp" };
const MORE = [{ href: "/about", label: "Our story" }, { href: "/reviews", label: "Reviews" }, { href: "/contact", label: "Contact" }];

export async function Footer() {
  const s = await getSettings();
  const socials = SOCIAL_KEYS.filter((k) => s.social[k]);
  const c = s.contact;
  return (
    <footer className="bg-forest-950 text-ivory-200">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-4 lg:px-8">
        <div className="lg:col-span-1">
          <p className="font-display text-3xl text-ivory-50"><Wordmark name={s.siteName} /></p>
          {s.about.headline && <p className="mt-3 max-w-sm text-sm leading-relaxed text-ivory-300">{s.about.headline}</p>}
          {socials.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-2">
              {socials.map((k) => (
                <li key={k}><a href={s.social[k]} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/15 px-3 py-1.5 text-xs hover:border-saffron hover:text-saffron">{SOCIAL_LABEL[k]}</a></li>
              ))}
            </ul>
          )}
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 content-start gap-2 text-sm lg:col-span-2">
          {[...NAV_LINKS, ...MORE].map((l) => <Link key={l.href} href={l.href} className="hover:text-saffron">{l.label}</Link>)}
        </nav>
        <div className="space-y-3 text-sm leading-relaxed text-ivory-300">
          {c.email && <a href={`mailto:${c.email}`} className="flex items-center gap-2 hover:text-saffron"><Mail size={15} />{c.email}</a>}
          {c.phone && <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="flex items-center gap-2 hover:text-saffron"><Phone size={15} />{c.phone}</a>}
          {c.address && <p className="flex gap-2"><MapPin size={15} className="mt-1 shrink-0" /><span className="whitespace-pre-line">{c.address}</span></p>}
          {s.footerNote && <p>{s.footerNote}</p>}
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-ivory-300">
        © {new Date().getFullYear()} {s.siteName}.{!isSupabaseConfigured && " Sample content shown for demonstration."} ·{" "}
        <Link href="/credits" className="underline underline-offset-2 hover:text-saffron">Photo credits</Link>
      </div>
    </footer>
  );
}
