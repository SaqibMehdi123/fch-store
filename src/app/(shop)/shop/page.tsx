import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { getCategoryBranch, getCategoryTree, getFilterFacets, listProducts, parseShopParams } from "@/lib/products";
import { ProductCard } from "@/components/store/product-card";
import {
  ActiveFilters,
  FilterSidebar,
  MobileFilters,
  ShopPagination,
  SortSelect,
} from "@/components/store/shop-filters";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const metadata: Metadata = {
  title: "Shop All — Fashion and Collection House",
  description:
    "Browse the full FCH collection: kurtas, lawn suits, formals, trousers and kids wear. Filter by category, size, colour and price — delivered nationwide.",
};

export default async function ShopPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const query = parseShopParams(sp);

  const [result, tree, facets, branch] = await Promise.all([
    listProducts(query),
    getCategoryTree(),
    getFilterFacets(),
    query.categorySlug ? getCategoryBranch(query.categorySlug) : Promise.resolve(null),
  ]);

  const title = branch
    ? branch.category.name
    : query.availability === "on_sale"
      ? "Sale"
      : query.q
        ? `Search: “${query.q}”`
        : "Shop All";

  const activeTop = branch?.category ?? null;

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 lg:py-12">
      {/* header band */}
      <header className="border-b border-stone pb-6">
        <nav aria-label="Breadcrumb" className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-gold">Home</Link>
          <span aria-hidden className="mx-2">/</span>
          <Link href="/shop" className="transition-colors hover:text-gold">Shop</Link>
          {activeTop && (
            <>
              <span aria-hidden className="mx-2">/</span>
              <span className="text-foreground/70">{activeTop.name}</span>
            </>
          )}
        </nav>
        <h1 className="mt-3 font-display text-3xl capitalize sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {result.total} {result.total === 1 ? "product" : "products"}
          {activeTop && activeTop.parentId === null ? " across all ranges" : ""}
        </p>
      </header>

      <div className="mt-8 grid gap-10 lg:grid-cols-[230px_1fr]">
        <FilterSidebar tree={tree} facets={facets} query={query} />

        <div>
          {/* toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <MobileFilters tree={tree} facets={facets} query={query} total={result.total} />
            <div className="ml-auto">
              <SortSelect query={query} />
            </div>
          </div>

          {/* active filter chips */}
          <div className="mt-4">
            <ActiveFilters query={query} />
          </div>

          {/* grid */}
          {result.items.length ? (
            <>
              <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-2 xl:grid-cols-3">
                {result.items.map((p, i) => (
                  <ProductCard key={p.slug} product={p} priority={i < 3} />
                ))}
              </div>
              <ShopPagination query={query} result={result} />
            </>
          ) : (
            <div className="mt-16 flex flex-col items-center rounded-sm border border-stone bg-card px-6 py-16 text-center">
              <SearchX className="h-8 w-8 text-gold" strokeWidth={1.5} />
              <h2 className="mt-4 font-display text-2xl">Nothing matches those filters</h2>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Try removing a filter or two — or browse the full collection for new-season pieces.
              </p>
              <Link href="/shop" className="btn-luxury mt-6">
                Clear filters
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
