"use client";
import Image from "next/image";
import { useRef, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import type { Media as Photo } from "@/lib/cms/types";

/**
 * Full-screen hero stage. The photograph drifts and slowly zooms as the page scrolls, mist layers
 * (pure CSS) drift sideways, and the copy rises a little faster than the picture for depth.
 * The copy itself is server-rendered and passed in as children so it paints before JS loads.
 */
export function Hero({ photo, children }: { photo: Photo; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "7%"]);
  const imgScale = useTransform(scrollYProgress, [0, 1], [reduce ? 1 : 1.1, reduce ? 1 : 1.2]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "-14%"]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, reduce ? 1 : 0]);

  return (
    <section ref={ref} className="relative isolate flex min-h-svh items-end overflow-hidden bg-forest-950">
      <motion.div style={{ y: imgY, scale: imgScale }} className="absolute inset-0 -z-30 will-change-transform">
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          preload
          sizes="100vw"
          placeholder={photo.blur ? "blur" : "empty"}
          blurDataURL={photo.blur}
          className="object-cover object-[62%_40%]"
        />
      </motion.div>

      {/* Pull the cool blue of the photograph towards the brand's forest green. */}
      <div aria-hidden className="absolute inset-0 -z-20 bg-forest-800/20 mix-blend-multiply" />
      <div aria-hidden className="mist -z-20" />
      <div aria-hidden className="mist mist-slow -z-20" />
      {/* Header legibility over the bright sky, and a deep base for the headline. */}
      <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-1/3 bg-linear-to-b from-forest-950/70 to-transparent" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-t from-forest-950/95 via-forest-950/35 via-40% to-transparent to-70%" />

      <motion.div style={{ y: textY, opacity: fade }} className="mx-auto w-full max-w-7xl px-5 pb-24 pt-40 sm:pb-28 lg:px-8">
        {children}
      </motion.div>
    </section>
  );
}
