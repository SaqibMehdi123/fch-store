import type { Metadata } from "next";
import Link from "next/link";
import { listAdminOrders } from "@/lib/admin/queries";
import { formatPKR, formatDate, ORDER_STATUS_LABELS } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Orders",
  robots: { index: false, follow: false },
};

const TABS = ["all", "payment_submitted", "confirmed", "processing", "shipped", "delivered", "awaiting_payment", "payment_rejected", "cancelled", "expired"] as const;

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const status = sp.status ?? "all";
  const q = sp.q?.trim() ?? "";
  const page = Number(sp.page) || 1;
  const { rows, total, pages } = await listAdminOrders({ status, q, page });

  const qs = (over: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    Object.entries({ status, q, page, ...over }).forEach(([k, v]) => {
      if (v !== undefined && v !== "" && !(k === "page" && (v === 1 || v === "1"))) p.set(k, String(v));
    });
    return `/admin/orders?${p.toString()}`;
  };

  return (
    <div className="animate-fade-in">
      <p className="label-caps text-gold">Overview</p>
      <h1 className="mt-1 font-display text-3xl">Orders</h1>

      {/* search */}
      <form action="/admin/orders" method="get" className="mt-5 flex max-w-md gap-2">
        <input type="hidden" name="status" value={status} />
        <input
          name="q"
          defaultValue={q}
          placeholder="Search order no, name, phone or email…"
          className="w-full rounded-sm border border-stone bg-card px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-gold"
        />
        <button className="shrink-0 rounded-sm bg-primary px-4 py-2 text-xs font-medium uppercase tracking-wide text-primary-foreground transition-opacity hover:opacity-90">
          Search
        </button>
      </form>

      {/* status tabs */}
      <nav aria-label="Filter by status" className="mt-4 flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <Link
            key={t}
            href={qs({ status: t, page: 1 })}
            aria-current={status === t ? "true" : undefined}
            className={cn(
              "rounded-sm border px-3 py-1.5 text-[11px] uppercase tracking-wide transition-colors",
              status === t
                ? "border-primary bg-primary text-primary-foreground"
                : "border-stone bg-card text-muted-foreground hover:border-gold hover:text-gold"
            )}
          >
            {t === "all" ? "All" : ORDER_STATUS_LABELS[t] ?? t}
          </Link>
        ))}
      </nav>

      {/* table */}
      <div className="mt-5 overflow-x-auto rounded-sm border border-stone bg-card">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-stone text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Items</th>
              <th className="px-4 py-3 font-medium">Payment</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone">
            {rows.map((o) => (
              <tr key={o.id} className="transition-colors hover:bg-secondary">
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${o.orderNo}`} className="font-medium text-gold hover:underline">
                    {o.orderNo}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  {o.customerName}
                  <span className="block text-xs text-muted-foreground">{o.city}</span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(o.createdAt)}</td>
                <td className="px-4 py-3">{o.itemCount}</td>
                <td className="px-4 py-3">
                  {o.paymentStatus ? (
                    <span
                      className={cn(
                        "text-xs",
                        o.paymentStatus === "approved" && "text-emerald-700",
                        o.paymentStatus === "submitted" && "text-gold",
                        o.paymentStatus === "rejected" && "text-destructive"
                      )}
                    >
                      {o.paymentStatus}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs uppercase tracking-wide">{ORDER_STATUS_LABELS[o.status] ?? o.status}</span>
                </td>
                <td className="px-4 py-3 text-right font-medium">{formatPKR(o.total)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  No orders match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* pagination */}
      {pages > 1 && (
        <nav aria-label="Orders pagination" className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {page} of {pages} · {total} orders
          </span>
          <span className="flex gap-2">
            {page > 1 && (
              <Link href={qs({ page: page - 1 })} className="rounded-sm border border-stone px-3 py-1.5 transition-colors hover:border-gold hover:text-gold">
                ← Prev
              </Link>
            )}
            {page < pages && (
              <Link href={qs({ page: page + 1 })} className="rounded-sm border border-stone px-3 py-1.5 transition-colors hover:border-gold hover:text-gold">
                Next →
              </Link>
            )}
          </span>
        </nav>
      )}
    </div>
  );
}
