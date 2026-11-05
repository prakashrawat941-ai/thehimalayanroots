import type { Listing } from "@/lib/data/types";

type Palette = Listing["palette"];

const PALETTES: Record<Palette, { sky: [string, string]; layers: string[]; sun: string }> = {
  dawn: { sky: ["#f6c58b", "#fbe9cf"], layers: ["#d9a27a", "#a97a67", "#5f6b5a", "#2b4d3a", "#143222"], sun: "#fff3d6" },
  pine: { sky: ["#bcd5cb", "#eef3ea"], layers: ["#8fb0a0", "#5f8a76", "#3d6a55", "#254a3a", "#0f2a1e"], sun: "#ffffff" },
  snow: { sky: ["#9fb7d6", "#eaf0f8"], layers: ["#dfe8f3", "#a9bad2", "#6c819f", "#3c5272", "#1f2f46"], sun: "#ffffff" },
  dusk: { sky: ["#6d5a86", "#e9b28c"], layers: ["#b3849b", "#85658d", "#5b4a77", "#3a3358", "#1d1c3a"], sun: "#ffd9b0" },
  meadow: { sky: ["#cfe5d2", "#f5f1dc"], layers: ["#a4c58f", "#74a46b", "#4a8456", "#2e6444", "#143d29"], sun: "#fffbe0" },
};

function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function ridge(rand: () => number, base: number, amp: number, steps = 9) {
  const pts: string[] = [`0,400`];
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * 800;
    const y = base - rand() * amp;
    pts.push(`${x.toFixed(0)},${y.toFixed(0)}`);
  }
  pts.push("800,400");
  return pts.join(" ");
}

/** Procedural layered-ridge landscape used when a listing has no photograph. Decorative only. */
export function Landscape({ seed, palette, className = "" }: { seed: string; palette: Palette; className?: string }) {
  const p = PALETTES[palette];
  const rand = seeded(seed);
  const id = `sky-${seed}`.replace(/[^a-z0-9-]/gi, "");
  const sunX = 120 + rand() * 560;
  return (
    <svg viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.sky[0]} />
          <stop offset="1" stopColor={p.sky[1]} />
        </linearGradient>
      </defs>
      <rect width="800" height="400" fill={`url(#${id})`} />
      <circle cx={sunX} cy={110} r={34} fill={p.sun} opacity="0.85" />
      {p.layers.map((fill, i) => (
        <polygon key={i} points={ridge(rand, 190 + i * 38, 150 - i * 18, 7 + i)} fill={fill} opacity={i === 0 ? 0.75 : 1} />
      ))}
    </svg>
  );
}
