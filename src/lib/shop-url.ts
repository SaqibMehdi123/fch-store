/**
 * Shop URL/query utilities — pure, client-safe (no server imports).
 * Shared by server pages and client filter components.
 */

export type SortKey = "newest" | "price_asc" | "price_desc" | "bestselling";
export type Availability = "all" | "in_stock" | "on_sale";

export type ShopQuery = {
  categorySlug: string | null;
  sizes: string[];
  colors: string[];
  min: number | null;
  max: number | null;
  availability: Availability;
  q: string | null;
  sort: SortKey;
  page: number;
};

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "bestselling", label: "Best Selling" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

/** Parse Next.js searchParams into a validated ShopQuery. */
export function parseShopParams(sp: Record<string, string | string[] | undefined>): ShopQuery {
  const one = (k: string): string | undefined => {
    const v = sp[k];
    return (Array.isArray(v) ? v[0] : v) || undefined;
  };
  const many = (k: string): string[] => {
    const v = sp[k];
    const arr = Array.isArray(v) ? v : v ? [v] : [];
    return arr.flatMap((s) => s.split(",")).map((s) => s.trim()).filter(Boolean);
  };

  const num = (k: string): number | null => {
    const n = Number(one(k));
    return Number.isFinite(n) && n >= 0 ? n : null;
  };

  const sortRaw = one("sort");
  const sort: SortKey = SORT_OPTIONS.find((o) => o.value === sortRaw)?.value ?? "newest";
  const availRaw = one("availability") ?? (one("on_sale") === "1" ? "on_sale" : undefined);
  const availability: Availability =
    availRaw === "in_stock" || availRaw === "on_sale" ? availRaw : "all";

  let min = num("min");
  let max = num("max");
  if (min !== null && max !== null && min > max) [min, max] = [max, min];

  return {
    categorySlug: one("category") || null,
    // normalize "OneSize" → "One Size" (DB label)
    sizes: many("size").map((s) => (s.toLowerCase() === "onesize" ? "One Size" : s)),
    colors: many("color"),
    min,
    max,
    availability,
    q: one("q")?.trim() || null,
    sort,
    page: Math.max(1, Math.floor(num("page") ?? 1)),
  };
}

/** Build a /shop URL from a query object, applying updates. Filters reset to page 1. */
export function shopHref(query: ShopQuery, updates: Partial<ShopQuery> = {}): string {
  const q: ShopQuery = { ...query, ...updates };
  if (!("page" in updates)) q.page = 1;
  const sp = new URLSearchParams();
  if (q.categorySlug) sp.set("category", q.categorySlug);
  for (const s of q.sizes) sp.append("size", s);
  for (const c of q.colors) sp.append("color", c);
  if (q.min !== null) sp.set("min", String(q.min));
  if (q.max !== null) sp.set("max", String(q.max));
  if (q.availability === "in_stock") sp.set("availability", "in_stock");
  if (q.availability === "on_sale") sp.set("on_sale", "1");
  if (q.q) sp.set("q", q.q);
  if (q.sort !== "newest") sp.set("sort", q.sort);
  if (q.page > 1) sp.set("page", String(q.page));
  const qs = sp.toString();
  return `/shop${qs ? `?${qs}` : ""}`;
}
