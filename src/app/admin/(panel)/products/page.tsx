import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { listAdminProducts } from "@/lib/admin/queries";
import { formatPKR, effectivePrice } from "@/lib/format";
import { ProductActiveToggle } from "@/components/admin/product-active-toggle";

export const metadata: Metadata = {
  title: "Products",
  robots: { index: false, follow: false },
};

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const page = Number(sp.page) || 1;
  const { rows, total, page: current, pages } = await listAdminProducts({ q, page });

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="label-caps text-gold">Catalog</p>
          <h1 className="mt-1 font-display text-3xl">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">{total} product{total === 1 ? "" : "s"} in the catalog.</p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> New product
        </Link>
      </div>

      <form action="/admin/products" method="get" className="mt-5 flex max-w-md gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name or slug…"
          className="w-full rounded-sm border border-stone bg-card px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-gold"
        />
        <button className="shrink-0 rounded-sm bg-primary px-4 py-2 text-xs font-medium uppercase tracking-wide text-primary-foreground transition-opacity hover:opacity-90">
          Search
        </button>
      </form>

      <div className="mt-5 overflow-x-auto rounded-sm border border-stone bg-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-stone text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Variants</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Live</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone">
            {rows.map((p) => (
              <tr key={p.id} className="transition-colors hover:bg-secondary">
                <td className="px-4 py-3">
                  <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                    <span className="flex h-12 w-10 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-stone">
                      {p.image ? (
                        <img src={p.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-[10px] text-muted-foreground">no img</span>
                      )}
                    </span>
                    <span>
                      <span className="block font-medium hover:text-gold">{p.name}</span>
                      <span className="block text-xs text-muted-foreground">/{p.slug}</span>
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{p.categoryName}</td>
                <td className="px-4 py-3">{p.variantCount}</td>
                <td className="px-4 py-3">
                  <span className={p.stock === 0 ? "text-destructive" : p.stock <= 5 ? "text-gold" : ""}>{p.stock}</span>
                </td>
                <td className="px-4 py-3">
                  {p.salePrice ? (
                    <>
                      <span className="text-gold">{formatPKR(effectivePrice(p.price, p.salePrice))}</span>{" "}
                      <span className="text-xs text-muted-foreground line-through">{formatPKR(p.price)}</span>
                    </>
                  ) : (
                    formatPKR(p.price)
                  )}
                </td>
                <td className="px-4 py-3">
                  <ProductActiveToggle id={p.id} name={p.name} isActive={p.isActive} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  No products match this search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <nav aria-label="Products pagination" className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {current} of {pages}
          </span>
          <span className="flex gap-2">
            {current > 1 && (
              <Link href={`/admin/products?q=${encodeURIComponent(q)}&page=${current - 1}`} className="rounded-sm border border-stone px-3 py-1.5 transition-colors hover:border-gold hover:text-gold">
                ← Prev
              </Link>
            )}
            {current < pages && (
              <Link href={`/admin/products?q=${encodeURIComponent(q)}&page=${current + 1}`} className="rounded-sm border border-stone px-3 py-1.5 transition-colors hover:border-gold hover:text-gold">
                Next →
              </Link>
            )}
          </span>
        </nav>
      )}
    </div>
  );
}
