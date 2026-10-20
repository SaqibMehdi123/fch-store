import type { NextConfig } from "next";

/**
 * Production security headers — applied to every route.
 * (A strict CSP is intentionally omitted: NextAuth and Next.js inline
 * bootstrap scripts require nonce plumbing that isn't worth the fragility
 * here; the headers below cover the high-value, zero-risk set.)
 */
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  images: {
    // Product/banner media lives on Cloudinary (signed uploads via
    // src/lib/upload.ts); the local /uploads + /placeholders fallbacks are
    // same-origin and need no pattern. This unlocks next/image optimization
    // (AVIF/WebP + responsive srcset) for the storefront's LCP surfaces.
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
    ],
    // The seeded catalogue ships SVG placeholders; without this the image
    // optimizer 400s every SVG src. SVGs are served as-is (never rasterized),
    // and the CSP + disposition sandbox them exactly as the Next.js docs
    // prescribe for allowing SVG through /_next/image.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
