import type { MetadataRoute } from "next";

/**
 * robots.txt derived from NEXTAUTH_URL so production, preview and local
 * environments each reference their own origin's sitemap. Crawler-private
 * surfaces (admin, api, cart/checkout flows) are disallowed.
 */
const BASE = (process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/api/", "/cart", "/checkout", "/wishlist", "/order/", "/track-order?"],
      },
      {
        // AI crawlers that heavy-load sites for training — keep them off the catalog
        userAgent: ["GPTBot", "CCBot"],
        disallow: "/",
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
