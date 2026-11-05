import type { NextConfig } from "next";

// GitHub Pages project sites are hosted below /<repository>.
// Keep local development and the existing server-rendered build unchanged
// until the server-action/API-route migration is complete.
const isGitHubPages = process.env.GITHUB_PAGES === "true";
const basePath = isGitHubPages ? "/thehimalayanroots" : "";

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
};

export default nextConfig;
