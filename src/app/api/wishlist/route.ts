import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { PRODUCT_INCLUDE, toCardData } from "@/lib/products";

/**
 * POST /api/wishlist — resolve saved slugs into product card data.
 * Body: { slugs: string[] } → { items: ProductCardData[] }
 * Wishlist lives client-side (localStorage); this endpoint only enriches it.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { slugs?: unknown };
    const slugs = Array.isArray(body.slugs)
      ? body.slugs.filter((s): s is string => typeof s === "string").slice(0, 50)
      : [];

    if (!slugs.length) return NextResponse.json({ items: [] });

    const rows = await db.product.findMany({
      where: { isActive: true, slug: { in: slugs } },
      include: PRODUCT_INCLUDE,
    });

    // preserve the client's order
    const bySlug = new Map(rows.map((r) => [r.slug, toCardData(r)]));
    const items = slugs.map((s) => bySlug.get(s)).filter((x) => x !== undefined);

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [], error: "Could not load wishlist" }, { status: 500 });
  }
}
