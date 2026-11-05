import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { ContactForm } from "@/components/PublicForms";
import { getSettings } from "@/lib/cms/queries";

export const metadata: Metadata = { title: "Contact us", description: "Questions about a village, a stay or a route? Write to us." };

export default async function ContactPage() {
  const { contact: c } = await getSettings();
  const wa = c.whatsapp?.replace(/[^\d]/g, "");
  return (
    <>
      <PageHero eyebrow="Contact" title="Talk to the team" intro="Questions about a village, a stay or a route? We reply to every message." seed="contact" palette="pine" />
      <section className="mx-auto grid max-w-6xl gap-12 px-5 py-16 lg:grid-cols-[1fr_1.4fr] lg:px-8">
        <div className="space-y-5 text-forest-900">
          {c.email && <a href={`mailto:${c.email}`} className="flex items-center gap-3 hover:text-clay"><Mail size={18} className="text-saffron" />{c.email}</a>}
          {c.phone && <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="flex items-center gap-3 hover:text-clay"><Phone size={18} className="text-saffron" />{c.phone}</a>}
          {wa && <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-clay"><MessageCircle size={18} className="text-saffron" />WhatsApp us</a>}
          {c.address && <p className="flex gap-3"><MapPin size={18} className="mt-0.5 shrink-0 text-saffron" /><span className="whitespace-pre-line">{c.address}</span></p>}
          {c.hours && <p className="flex items-center gap-3"><Clock size={18} className="text-saffron" />{c.hours}</p>}
          {c.mapUrl && <a href={c.mapUrl} target="_blank" rel="noopener noreferrer" className="inline-block rounded-full border border-forest-800 px-5 py-2.5 text-sm hover:bg-forest-800 hover:text-ivory-50">Open map</a>}
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-forest-900/5 sm:p-8"><ContactForm /></div>
      </section>
    </>
  );
}
