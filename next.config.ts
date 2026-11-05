import type { NextConfig } from "next";

// GitHub Pages project sites are hosted below /<repository>.
// Keep local development and the existing server-rendered build unchanged
// until the server-action/API-route migration is complete.
const isGitHubPages = process.env.GITHUB_PAGES === "true";
const basePath = isGitHubPages ? "/thehimalayanroots" : "";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  ...(basePath ? { basePath } : {}),
  trailingSlash: true,
  poweredByHeader: false,
  reactStrictMode: true,
  // GitHub Pages cannot run Next's image optimization server.
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      ...(supabaseHost
        ? [{ protocol: "https" as const, hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
        : []),
    ],
  },
  // GitHub Pages does not support response-header configuration. Preserve
  // headers for local/other server builds while static hosting is prepared.
  ...(!isGitHubPages
    ? {
        async headers() {
          return [{ source: "/(.*)", headers: securityHeaders }];
        },
      }
    : {}),
};

export default nextConfig;
