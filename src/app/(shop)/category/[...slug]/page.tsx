import { redirect } from "next/navigation";
import { getCategoryRootSlug } from "@/lib/products";
import { DEPARTMENT_SLUGS } from "@/lib/shop-url";

type Params = Promise<{ slug: string[] }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/**
 * Category route — /category/women/luxury-pret → /women?category=women-luxury-pret
 * Hierarchical slugs are joined with "-"; all other query params are preserved.
 * The redirect target is the department page the category belongs to, so each
 * department keeps its own filter surface. Non-department categories fall back
 * to /shop.
 */
export default async function CategoryRoute({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const categorySlug = slug.map((s) => decodeURIComponent(s)).join("-");
  const rootSlug = await getCategoryRootSlug(categorySlug);
  const base = rootSlug && (DEPARTMENT_SLUGS as readonly string[]).includes(rootSlug)
    ? `/${rootSlug}`
    : "/shop";

  const target = new URLSearchParams();
  target.set("category", categorySlug);
  for (const [key, value] of Object.entries(sp)) {
    if (key === "category") continue;
    if (Array.isArray(value)) value.forEach((v) => target.append(key, v));
    else if (value !== undefined) target.set(key, v);
  }
  redirect(`${base}?${target.toString()}`);
}
