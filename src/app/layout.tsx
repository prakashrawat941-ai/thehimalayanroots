import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { Header } from "@/components/Header";
import { PWARegister } from "@/components/PWARegister";
import { Footer } from "@/components/Footer";
import { siteUrl } from "@/lib/supabase/config";
import { getSettings } from "@/lib/cms/queries";
import { COLOR_KEYS } from "@/lib/cms/types";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-cormorant", display: "swap" });
// One italic weight only, used for single accent words in headlines.
const cormorantItalic = Cormorant_Garamond({ subsets: ["latin"], weight: ["400"], style: ["italic"], variable: "--font-cormorant-italic", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    metadataBase: new URL(siteUrl),
    manifest: "/manifest.json",
    appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Himalayan Roots" },
    title: { default: s.tagline ? `${s.siteName} · ${s.tagline}` : s.siteName, template: `%s · ${s.siteName}` },
    description: s.description || undefined,
    openGraph: { type: "website", siteName: s.siteName },
    ...(s.favicon && { icons: { icon: s.favicon.src, apple: s.favicon.src } }),
  };
}

export const viewport: Viewport = { themeColor: "#102a1d", width: "device-width", initialScale: 1, interactiveWidget: "resizes-content" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { colors } = await getSettings();
  // Values are validated as #rrggbb on save, so this cannot inject CSS.
  const vars = COLOR_KEYS.filter((k) => colors[k] && /^#[0-9a-f]{6}$/i.test(colors[k]!)).map((k) => `--color-${k}:${colors[k]}`).join(";");
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable} ${cormorantItalic.variable}`}>
      <body>
        <PWARegister />
        {vars && <style>{`:root{${vars}}`}</style>}
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-ivory-50 focus:px-4 focus:py-2">Skip to content</a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
