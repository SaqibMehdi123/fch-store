import { redirect } from "next/navigation";

type Params = Promise<{ slug: string[] }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/**
 * Category route — /category/women/luxury-pret → /shop?category=women-luxury-pret
 * Hierarchical slugs are joined with "-"; all other query params are preserved.
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
  const target = new URLSearchParams();
  target.set("category", categorySlug);
  for (const [key, value] of Object.entries(sp)) {
    if (key === "category") continue;
    if (Array.isArray(value)) value.forEach((v) => target.append(key, v));
    else if (value !== undefined) target.set(key, value);
  }
  redirect(`/shop?${target.toString()}`);
}
