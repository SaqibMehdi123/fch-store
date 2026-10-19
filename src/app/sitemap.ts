import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

/**
 * Dynamic sitemap — static storefront routes plus every active product,
 * active CMS page and top-level category from the database.
 * DB reads are wrapped so a database outage degrades to the static list
 * instead of erroring the route.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

const BASE = (process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    "",
    "/shop",
    "/women",
    "/men",
    "/kids",
    "/about",
    "/contact",
    "/faq",
    "/terms",
    "/privacy",
  ].map((path) => ({
    url: `${BASE}${path}`,
    lastModified: now,
    changeFrequency: path === "" || path.startsWith("/w") || path.startsWith("/m") || path.startsWith("/k") ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  try {
    const [products, pages] = await Promise.all([
      db.product.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
      }),
      db.page.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
      }),
    ]);

    return [
      ...staticEntries,
      ...products.map((p) => ({
        url: `${BASE}/product/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.9,
      })),
      ...pages
        .filter((pg) => ["about", "faq", "terms", "privacy"].includes(pg.slug))
        .map((pg) => ({
          url: `${BASE}/${pg.slug}`,
          lastModified: pg.updatedAt,
          changeFrequency: "monthly" as const,
          priority: 0.4,
        })),
    ];
  } catch {
    // DB unreachable — serve the static shell so crawlers still get a valid sitemap.
    return staticEntries;
  }
}
