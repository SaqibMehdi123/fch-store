import type { Metadata } from "next";
import Link from "next/link";
import { listInventory } from "@/lib/admin/queries";
import { InventoryRow } from "@/components/admin/inventory-row";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Inventory",
  robots: { index: false, follow: false },
};

const FILTERS = [
  { key: "all", label: "All SKUs" },
  { key: "low", label: "Low stock" },
  { key: "out", label: "Out of stock" },
] as const;

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string }>;
}) {
  const sp = await searchParams;
  const filter = FILTERS.some((f) => f.key === sp.filter) ? sp.filter! : "all";
  const q = sp.q?.trim() ?? "";
  const { rows, outCount, lowCount, totalCount } = await listInventory({ q, filter });

  const qs = (over: Record<string, string>) => {
    const p = new URLSearchParams({ filter, ...(q ? { q } : {}), ...over });
    return `/admin/inventory?${p.toString()}`;
  };

  return (
    <div className="animate-fade-in">
      <p className="label-caps text-gold">Catalog</p>
      <h1 className="mt-1 font-display text-3xl">Inventory</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {totalCount} SKUs ·{" "}
        <Link href={qs({ filter: "low" })} className="text-gold hover:underline">{lowCount} low</Link> ·{" "}
        <Link href={qs({ filter: "out" })} className="text-destructive hover:underline">{outCount} out of stock</Link>
      </p>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Inventory filter" className="flex gap-1.5">
          {FILTERS.map((f) => (
            <Link
              key={f.key}
              href={qs({ filter: f.key })}
              aria-current={filter === f.key ? "true" : undefined}
              className={cn(
                "rounded-sm border px-3 py-1.5 text-[11px] uppercase tracking-wide transition-colors",
                filter === f.key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-stone bg-card text-muted-foreground hover:border-gold hover:text-gold"
              )}
            >
              {f.label}
            </Link>
          ))}
        </nav>
        <form action="/admin/inventory" method="get" className="flex gap-2">
          <input type="hidden" name="filter" value={filter} />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search SKU, product, color…"
            className="w-64 rounded-sm border border-stone bg-card px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-gold"
          />
          <button className="shrink-0 rounded-sm bg-primary px-4 py-2 text-xs font-medium uppercase tracking-wide text-primary-foreground transition-opacity hover:opacity-90">
            Search
          </button>
        </form>
      </div>

      <div className="mt-5 overflow-x-auto rounded-sm border border-stone bg-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-stone text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Variant</th>
              <th className="px-4 py-3 text-center font-medium">In stock</th>
              <th className="px-4 py-3 text-right font-medium">Set stock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone">
            {rows.map((v) => (
              <InventoryRow key={v.id} variant={v} />
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  Nothing matches this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Reserved units (customers with pending orders) are already excluded from these counts — stock decreases at
        checkout and is restored if an order expires unpaid.
      </p>
    </div>
  );
}
