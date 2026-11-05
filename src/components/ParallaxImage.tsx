"use client";
import Image from "next/image";
import { useRef, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import type { Media as Photo } from "@/lib/cms/types";

interface Props {
  photo: Photo;
  sizes: string;
  /** Parallax travel in percent of the frame height, each way. Keep it small: 5 to 10. */
  amount?: number;
  /** Classes for the frame (set the aspect ratio or height here). */
  className?: string;
  /** Classes for the <img>, e.g. object-position or a hover zoom. */
  imgClassName?: string;
  /** Hint for above-the-fold images. */
  preload?: boolean;
  children?: ReactNode;
}

/**
 * A framed photograph that moves slightly against the scroll. The image is oversized by exactly the
 * travel distance so the frame never shows an edge, and motion is disabled for reduced-motion users.
 */
export function ParallaxImage({ photo, sizes, amount = 7, className = "", imgClassName = "", preload = false, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const travel = reduce ? 0 : amount;
  const y = useTransform(scrollYProgress, [0, 1], [`${-travel}%`, `${travel}%`]);
  const scale = 1 + (travel * 2) / 100 + 0.02;

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.div style={{ y, scale }} className="absolute inset-0 will-change-transform">
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          preload={preload}
          sizes={sizes}
          placeholder={photo.blur ? "blur" : "empty"}
          blurDataURL={photo.blur}
          className={`object-cover ${imgClassName}`}
        />
      </motion.div>
      {children}
    </div>
  );
}
