import Link from "next/link";
import { SearchX } from "lucide-react";
import {
  getCategoryBranch,
  getCategoryTree,
  getDepartment,
  getFilterFacets,
  listProducts,
  parseShopParams,
  shopHref,
} from "@/lib/products";
import { ProductCard } from "@/components/store/product-card";
import { JsonLd, breadcrumbLd, itemListLd } from "@/lib/seo";
import {
  ActiveFilters,
  FilterSidebar,
  MobileFilters,
  ShopPagination,
  SortSelect,
} from "@/components/store/shop-filters";

type SearchParams = Record<string, string | string[] | undefined>;

const DEPARTMENT_COPY: Record<string, { blurb: string }> = {
  women: {
    blurb:
      "Pret, unstitched classics and occasion formals — designed for the modern Pakistani wardrobe, from everyday lawn to evening luxury.",
  },
  men: {
    blurb:
      "Kurta shalwar, waistcoats and tailored separates — considered fabrics and clean cuts for every day and every occasion.",
  },
  kids: {
    blurb:
      "Soft, durable essentials for boys and girls — playful pieces cut from breathable fabrics that keep up with the day.",
  },
};

/**
 * Shared catalog listing used by every department page (/women /men /kids)
 * and the cross-department Shop All page (/shop). Each surface gets its own
 * scoped filter sidebar — departments show only their own sub-categories and
 * only sizes/colours/prices that occur within their range.
 */
export async function ListingPage({
  department,
  searchParams,
}: {
  department: string | null;
  searchParams: SearchParams;
}) {
  const query = parseShopParams(searchParams, {
    base: department ? `/${department}` : "/shop",
    department,
  });

  const [result, tree, facets, dept, branch] = await Promise.all([
    listProducts(query),
    department ? Promise.resolve([]) : getCategoryTree(),
    getFilterFacets(department),
    department ? getDepartment(department) : Promise.resolve(null),
    query.categorySlug ? getCategoryBranch(query.categorySlug) : Promise.resolve(null),
  ]);

  const deptName = dept?.root.name ?? null;
  const copy = dept ? DEPARTMENT_COPY[dept.root.slug] : undefined;
  const title = branch
    ? branch.category.name
    : deptName
      ? deptName
      : query.availability === "on_sale"
        ? "Sale"
        : query.q
          ? `Search: “${query.q}”`
          : "Shop All";

  const activeTop = branch?.category ?? null;

  const crumbs = [
    { name: "Home", path: "/" },
    { name: deptName ?? "Shop", path: query.base },
    ...(activeTop && dept && activeTop.slug !== dept.root.slug
      ? [{ name: activeTop.name, path: `/${dept.root.slug}?category=${activeTop.slug}` }]
      : []),
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 lg:py-12">
      <JsonLd
        data={[
          breadcrumbLd(crumbs),
          // Current result set (respects filters/sort/search) as an ItemList.
          itemListLd(result.items, `${title} — Fashion and Collection House`),
        ]}
      />

      {/* header band */}
      <header className="border-b border-stone pb-6">
        <nav aria-label="Breadcrumb" className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-gold">Home</Link>
          <span aria-hidden className="mx-2">/</span>
          <Link href={query.base} className="transition-colors hover:text-gold">
            {deptName ?? "Shop"}
          </Link>
          {activeTop && dept && activeTop.slug !== dept.root.slug && (
            <>
              <span aria-hidden className="mx-2">/</span>
              <span className="text-foreground/70">{activeTop.name}</span>
            </>
          )}
        </nav>
        {copy ? (
          <div className="mt-3 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <h1 className="font-display text-3xl sm:text-4xl">{deptName}</h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{copy.blurb}</p>
            </div>
            <p className="shrink-0 text-sm text-muted-foreground sm:text-right">
              <span className="font-display text-2xl text-foreground">{result.total}</span>{" "}
              {result.total === 1 ? "product" : "products"}
            </p>
          </div>
        ) : (
          <>
            <h1 className="mt-3 font-display text-3xl capitalize sm:text-4xl">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {result.total} {result.total === 1 ? "product" : "products"}
            </p>
          </>
        )}
      </header>

      <div className="mt-8 grid gap-10 lg:grid-cols-[230px_1fr]">
        <FilterSidebar tree={tree} facets={facets} query={query} dept={dept?.root ?? null} />

        <div>
          {/* toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <MobileFilters tree={tree} facets={facets} query={query} dept={dept?.root ?? null} total={result.total} />
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
              <Link href={shopHref(query, { categorySlug: null, sizes: [], colors: [], min: null, max: null, availability: "all" })} className="btn-luxury mt-6">
                Clear filters
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
