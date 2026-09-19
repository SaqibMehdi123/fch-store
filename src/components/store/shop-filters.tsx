"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatPKR } from "@/lib/format";
import { SORT_OPTIONS, shopHref } from "@/lib/shop-url";
import type { CategoryNode, FilterFacets, ShopQuery, ShopResult, SortKey } from "@/lib/products";

// ---------------------------------------------------------------
// Shared filter panel content
// ---------------------------------------------------------------

/**
 * Category refinement for a department page: only that department's own
 * sub-categories appear — other departments are never shown here.
 */
function DepartmentCategoryList({
  dept,
  query,
  activeSlug,
  onNavigate,
}: {
  dept: CategoryNode;
  query: ShopQuery;
  activeSlug: string | null;
  onNavigate?: () => void;
}) {
  return (
    <ul className="space-y-1.5">
      <li>
        <Link
          href={shopHref(query, { categorySlug: null })}
          onClick={onNavigate}
          aria-current={activeSlug === null ? "true" : undefined}
          className={cn(
            "block py-0.5 text-sm transition-colors hover:text-gold",
            activeSlug === null ? "font-semibold text-gold" : "text-foreground/80"
          )}
        >
          All {dept.name}
        </Link>
      </li>
      {dept.children.map((child) => (
        <li key={child.id}>
          <Link
            href={shopHref(query, { categorySlug: child.slug })}
            onClick={onNavigate}
            aria-current={activeSlug === child.slug ? "true" : undefined}
            className={cn(
              "block py-0.5 text-sm transition-colors hover:text-gold",
              activeSlug === child.slug ? "font-semibold text-gold" : "text-foreground/80"
            )}
          >
            {child.name}
            {child.count > 0 && <span className="ml-1.5 text-[11px] text-muted-foreground/70">({child.count})</span>}
          </Link>
          {child.children.length > 0 && (
            <ul className="ml-3 mt-1 space-y-1.5 border-l border-stone pl-3">
              {child.children.map((gc) => {
                const active = activeSlug === gc.slug;
                return (
                  <li key={gc.id}>
                    <Link
                      href={shopHref(query, { categorySlug: gc.slug })}
                      onClick={onNavigate}
                      aria-current={active ? "true" : undefined}
                      className={cn(
                        "block py-0.5 text-[13px] transition-colors hover:text-gold",
                        active ? "font-semibold text-gold" : "text-foreground/70"
                      )}
                    >
                      {gc.name}
                      {gc.count > 0 && <span className="ml-1.5 text-[11px] text-muted-foreground/70">({gc.count})</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Shop All page — a light row of department links instead of the full tree. */
function DepartmentSwitcher({
  tree,
  query,
  onNavigate,
}: {
  tree: CategoryNode[];
  query: ShopQuery;
  onNavigate?: () => void;
}) {
  return (
    <ul className="space-y-1.5">
      {tree.map((top) => (
        <li key={top.id}>
          <Link
            href={`/${top.slug}`}
            onClick={onNavigate}
            className="flex items-center justify-between py-0.5 text-sm text-foreground/80 transition-colors hover:text-gold"
          >
            {top.name}
            {top.count > 0 && <span className="text-[11px] text-muted-foreground/70">({top.count})</span>}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function SizeChips({ query, sizes, onNavigate }: { query: ShopQuery; sizes: string[]; onNavigate?: () => void }) {
  const toggle = (size: string) => {
    const next = query.sizes.includes(size) ? query.sizes.filter((s) => s !== size) : [...query.sizes, size];
    return shopHref(query, { sizes: next });
  };
  return (
    <div className="flex flex-wrap gap-2">
      {sizes.map((size) => {
        const active = query.sizes.includes(size);
        return (
          <Link
            key={size}
            href={toggle(size)}
            onClick={onNavigate}
            aria-pressed={active}
            className={cn(
              "inline-flex h-9 min-w-11 items-center justify-center rounded-sm border px-2.5 text-[12px] tracking-wide transition-all",
              active
                ? "border-gold bg-gold text-white"
                : "border-stone bg-background text-foreground/80 hover:border-foreground/40"
            )}
          >
            {size}
          </Link>
        );
      })}
    </div>
  );
}

function ColorChips({ query, colors, onNavigate }: { query: ShopQuery; colors: { name: string; hex: string }[]; onNavigate?: () => void }) {
  const toggle = (name: string) => {
    const next = query.colors.includes(name) ? query.colors.filter((c) => c !== name) : [...query.colors, name];
    return shopHref(query, { colors: next });
  };
  return (
    <div className="flex flex-wrap gap-2.5">
      {colors.map((c) => {
        const active = query.colors.includes(c.name);
        return (
          <Link
            key={c.name}
            href={toggle(c.name)}
            onClick={onNavigate}
            aria-pressed={active}
            title={c.name}
            className={cn(
              "group/color relative inline-flex h-8 w-8 items-center justify-center rounded-full border transition-all",
              active ? "border-gold ring-1 ring-gold ring-offset-2 ring-offset-background" : "border-stone hover:border-foreground/40"
            )}
          >
            <span
              className="h-5.5 w-5.5 rounded-full border border-black/10"
              style={{ backgroundColor: c.hex }}
              aria-hidden
            />
            <span className="sr-only">{c.name}</span>
          </Link>
        );
      })}
    </div>
  );
}

function PriceFilter({
  query,
  facets,
  onNavigate,
}: {
  query: ShopQuery;
  facets: FilterFacets;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const [min, setMin] = useState(query.min !== null ? String(query.min) : "");
  const [max, setMax] = useState(query.max !== null ? String(query.max) : "");
  const touched = min !== (query.min !== null ? String(query.min) : "") || max !== (query.max !== null ? String(query.max) : "");

  const applyValue = (mn: number | null, mx: number | null) => {
    const url = shopHref(query, { min: mn, max: mx });
    if (onNavigate) onNavigate();
    router.push(url);
  };

  const apply = () => {
    const mn = min.trim() === "" ? null : Number(min);
    const mx = max.trim() === "" ? null : Number(max);
    applyValue(
      mn !== null && Number.isFinite(mn) && mn >= 0 ? mn : null,
      mx !== null && Number.isFinite(mx) && mx >= 0 ? mx : null
    );
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          placeholder={String(facets.priceMin)}
          aria-label="Minimum price"
          value={min}
          onChange={(e) => setMin(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply()}
          className="h-9 w-full rounded-sm border border-stone bg-background px-2.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-gold"
        />
        <span className="text-muted-foreground">—</span>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          placeholder={String(facets.priceMax)}
          aria-label="Maximum price"
          value={max}
          onChange={(e) => setMax(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply()}
          className="h-9 w-full rounded-sm border border-stone bg-background px-2.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-gold"
        />
      </div>
      {touched && (
        <Button variant="luxury" size="sm" className="mt-2.5 w-full" onClick={apply}>
          Apply price
        </Button>
      )}
      {(query.min !== null || query.max !== null) && (
        <button
          type="button"
          onClick={() => {
            setMin("");
            setMax("");
            applyValue(null, null);
          }}
          className="mt-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground underline-offset-2 hover:text-gold hover:underline"
        >
          Clear price range
        </button>
      )}
    </div>
  );
}

function AvailabilityList({ query, onNavigate }: { query: ShopQuery; onNavigate?: () => void }) {
  const options: { value: "all" | "in_stock" | "on_sale"; label: string }[] = [
    { value: "all", label: "All items" },
    { value: "in_stock", label: "In stock only" },
    { value: "on_sale", label: "On sale" },
  ];
  return (
    <ul className="space-y-1.5">
      {options.map((o) => (
        <li key={o.value}>
          <Link
            href={shopHref(query, { availability: o.value })}
            onClick={onNavigate}
            aria-current={query.availability === o.value ? "true" : undefined}
            className={cn(
              "block py-0.5 text-sm transition-colors hover:text-gold",
              query.availability === o.value ? "font-semibold text-gold" : "text-foreground/80"
            )}
          >
            {o.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-stone pb-6 last:border-0 last:pb-0">
      <h3 className="label-caps mb-3.5">{title}</h3>
      {children}
    </section>
  );
}

function FilterPanel({
  dept,
  tree,
  facets,
  query,
  onNavigate,
}: {
  dept: CategoryNode | null;
  tree: CategoryNode[];
  facets: FilterFacets;
  query: ShopQuery;
  onNavigate?: () => void;
}) {
  const hasFilters =
    query.categorySlug || query.sizes.length || query.colors.length || query.min !== null || query.max !== null || query.availability !== "all";

  return (
    <div className="space-y-6">
      {hasFilters && (
        <Link
          href={shopHref(query, {
            categorySlug: null,
            sizes: [],
            colors: [],
            min: null,
            max: null,
            availability: "all",
          })}
          onClick={onNavigate}
          className="inline-flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-[0.14em] text-gold hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" /> Clear all filters
        </Link>
      )}

      {dept ? (
        <FilterGroup title="Category">
          <DepartmentCategoryList dept={dept} query={query} activeSlug={query.categorySlug} onNavigate={onNavigate} />
        </FilterGroup>
      ) : (
        <FilterGroup title="Department">
          <DepartmentSwitcher tree={tree} query={query} onNavigate={onNavigate} />
        </FilterGroup>
      )}

      <FilterGroup title="Size">
        <SizeChips query={query} sizes={facets.sizes} onNavigate={onNavigate} />
      </FilterGroup>

      <FilterGroup title="Colour">
        <ColorChips query={query} colors={facets.colors} onNavigate={onNavigate} />
      </FilterGroup>

      <FilterGroup title="Price">
        <PriceFilter query={query} facets={facets} onNavigate={onNavigate} />
      </FilterGroup>

      <FilterGroup title="Availability">
        <AvailabilityList query={query} onNavigate={onNavigate} />
      </FilterGroup>
    </div>
  );
}

// ---------------------------------------------------------------
// Exported pieces used by the shop page
// ---------------------------------------------------------------

export function FilterSidebar(props: {
  dept: CategoryNode | null;
  tree: CategoryNode[];
  facets: FilterFacets;
  query: ShopQuery;
}) {
  return (
    <aside aria-label="Product filters" className="hidden lg:block">
      <FilterPanel {...props} />
    </aside>
  );
}

export function MobileFilters(props: {
  dept: CategoryNode | null;
  tree: CategoryNode[];
  facets: FilterFacets;
  query: ShopQuery;
  total: number;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className="lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="h-10 gap-2 border-stone text-[12px] uppercase tracking-[0.14em]">
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 overflow-y-auto p-0">
          <div className="border-b border-stone p-4">
            <SheetTitle className="font-display text-lg">Filters</SheetTitle>
          </div>
          <div className="p-4">
            <FilterPanel {...props} onNavigate={close} />
          </div>
        </SheetContent>
      </Sheet>
      <span className="sr-only">{props.total} products match current filters</span>
    </div>
  );
}

export function SortSelect({ query }: { query: ShopQuery }) {
  const router = useRouter();
  return (
    <div className="flex items-center gap-2.5">
      <label htmlFor="sort" className="hidden text-[12px] uppercase tracking-[0.14em] text-muted-foreground sm:block">
        Sort
      </label>
      <Select
        value={query.sort}
        onValueChange={(v) => {
          const sort = v as SortKey;
          router.push(shopHref(query, { sort }), { scroll: false });
        }}
      >
        <SelectTrigger id="sort" className="h-10 w-[190px] rounded-sm border-stone text-sm">
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function ActiveFilters({ query }: { query: ShopQuery }) {
  const chips: { label: string; href: string }[] = [];

  if (query.categorySlug) {
    chips.push({
      label: query.categorySlug.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()),
      href: shopHref(query, { categorySlug: null }),
    });
  }
  for (const s of query.sizes) {
    chips.push({ label: `Size: ${s}`, href: shopHref(query, { sizes: query.sizes.filter((x) => x !== s) }) });
  }
  for (const c of query.colors) {
    chips.push({ label: c, href: shopHref(query, { colors: query.colors.filter((x) => x !== c) }) });
  }
  if (query.min !== null || query.max !== null) {
    chips.push({
      label: `${query.min !== null ? formatPKR(query.min) : "Rs. 0"} – ${query.max !== null ? formatPKR(query.max) : "∞"}`,
      href: shopHref(query, { min: null, max: null }),
    });
  }
  if (query.availability !== "all") {
    chips.push({
      label: query.availability === "in_stock" ? "In stock" : "On sale",
      href: shopHref(query, { availability: "all" }),
    });
  }
  if (query.q) {
    chips.push({ label: `“${query.q}”`, href: shopHref(query, { q: null }) });
  }

  if (!chips.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <Link
          key={chip.label}
          href={chip.href}
          scroll={false}
          className="inline-flex items-center gap-1.5 rounded-full border border-stone bg-card px-3 py-1.5 text-xs text-foreground/80 transition-colors hover:border-gold hover:text-gold"
        >
          {chip.label}
          <X className="h-3 w-3" aria-hidden />
        </Link>
      ))}
    </div>
  );
}

export function ShopPagination({ query, result }: { query: ShopQuery; result: Pick<ShopResult, "page" | "pageCount"> }) {
  const { page, pageCount } = result;
  if (pageCount <= 1) return null;

  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);

  return (
    <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-1.5">
      {page > 1 && (
        <Link
          href={shopHref(query, { page: page - 1 })}
          scroll
          aria-label="Previous page"
          className="inline-flex h-10 items-center rounded-sm border border-stone px-3 text-xs uppercase tracking-[0.14em] transition-colors hover:border-gold hover:text-gold"
        >
          Prev
        </Link>
      )}
      {pages.map((p) => (
        <Link
          key={p}
          href={shopHref(query, { page: p })}
          aria-current={p === page ? "page" : undefined}
          aria-label={`Page ${p}`}
          className={cn(
            "inline-flex h-10 w-10 items-center justify-center rounded-sm border text-sm transition-colors",
            p === page
              ? "border-gold bg-gold text-white"
              : "border-stone hover:border-gold hover:text-gold"
          )}
        >
          {p}
        </Link>
      ))}
      {page < pageCount && (
        <Link
          href={shopHref(query, { page: page + 1 })}
          scroll
          aria-label="Next page"
          className="inline-flex h-10 items-center rounded-sm border border-stone px-3 text-xs uppercase tracking-[0.14em] transition-colors hover:border-gold hover:text-gold"
        >
          Next
        </Link>
      )}
    </nav>
  );
}
