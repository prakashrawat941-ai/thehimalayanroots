"use client";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { NAV_LINKS } from "./nav";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((o) => !o)}
        className="relative z-50 rounded-full p-2 text-ivory-50"
      >
        {open ? <X size={26} /> : <Menu size={26} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.nav
            id="mobile-menu"
            aria-label="Mobile"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex flex-col justify-center gap-5 bg-forest-950/97 px-8"
          >
            {[...NAV_LINKS, { href: "/dashboard", label: "My Account" }].map((l, i) => (
              <motion.div key={l.href} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.05 * i }}>
                <Link href={l.href} onClick={() => setOpen(false)} className="font-display text-4xl text-ivory-50">
                  {l.label}
                </Link>
              </motion.div>
            ))}
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  );
}
