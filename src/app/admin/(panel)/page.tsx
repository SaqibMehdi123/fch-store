import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowRight, BadgeCheck, Boxes, Package, TrendingUp } from "lucide-react";
import { getDashboardStats } from "@/lib/admin/queries";
import { formatPKR, formatDate, ORDER_STATUS_LABELS } from "@/lib/format";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

const STATUS_KEYS = [
  "awaiting_payment",
  "payment_submitted",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "payment_rejected",
  "cancelled",
  "expired",
] as const;

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  const kpis = [
    { icon: TrendingUp, label: "Confirmed Sales Today", value: formatPKR(stats.todaySales), note: `${stats.todayOrders} paid order${stats.todayOrders === 1 ? "" : "s"} today` },
    { icon: Package, label: "Orders (7 days)", value: String(stats.orders7d), note: "all statuses, last 7 days" },
    { icon: BadgeCheck, label: "Pending Verifications", value: String(stats.pendingVerifications), note: "screenshots awaiting review" },
  ];

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-caps text-gold">Overview</p>
          <h1 className="mt-1 font-display text-3xl">Dashboard</h1>
        </div>
        <Link
          href="/admin/verification"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-gold"
        >
          Payment Verification {stats.pendingVerifications > 0 && `(${stats.pendingVerifications})`}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* KPIs */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {kpis.map(({ icon: Icon, label, value, note }) => (
          <div key={label} className="rounded-sm border border-stone bg-card p-5">
            <div className="flex items-center justify-between">
              <p className="label-caps text-muted-foreground">{label}</p>
              <Icon className="h-4 w-4 text-gold" strokeWidth={1.8} />
            </div>
            <p className="mt-3 font-display text-3xl">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{note}</p>
          </div>
        ))}
      </div>

      {/* orders by status */}
      <div className="mt-6 rounded-sm border border-stone bg-card">
        <div className="flex items-center justify-between border-b border-stone px-5 py-4">
          <h2 className="font-display text-lg">Orders by Status</h2>
          <Link href="/admin/orders" className="text-xs text-muted-foreground transition-colors hover:text-gold">
            View all orders
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-px bg-stone/60 sm:grid-cols-3 lg:grid-cols-5">
          {STATUS_KEYS.map((k) => (
            <Link
              key={k}
              href={`/admin/orders?status=${k}`}
              className="bg-card px-5 py-4 transition-colors hover:bg-secondary"
            >
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                {ORDER_STATUS_LABELS[k] ?? k}
              </p>
              <p className="mt-2 font-display text-2xl">{stats.byStatus[k] ?? 0}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* recent orders */}
        <div className="rounded-sm border border-stone bg-card lg:col-span-2">
          <div className="border-b border-stone px-5 py-4">
            <h2 className="font-display text-lg">Recent Orders</h2>
          </div>
          {stats.recent.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">
              No orders yet — they appear here as soon as customers check out.
            </div>
          ) : (
            <ul className="divide-y divide-stone">
              {stats.recent.map((o) => (
                <li key={o.orderNo}>
                  <Link
                    href={`/admin/orders/${o.orderNo}`}
                    className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-secondary"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {o.orderNo} · {o.customerName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(o.createdAt)} · {o.city} · {o.itemCount} item{o.itemCount === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm">{formatPKR(o.total)}</p>
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        {ORDER_STATUS_LABELS[o.status] ?? o.status}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* stock alerts */}
        <div className="rounded-sm border border-stone bg-card">
          <div className="flex items-center justify-between border-b border-stone px-5 py-4">
            <h2 className="font-display text-lg">Stock Alerts</h2>
            <Boxes className="h-4 w-4 text-gold" strokeWidth={1.8} />
          </div>
          {stats.lowStock.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">All variants are healthily stocked.</div>
          ) : (
            <>
              <ul className="divide-y divide-stone">
                {stats.lowStock.map((v) => (
                  <li key={v.sku} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm">{v.productName}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {v.color} · {v.size} · {v.sku}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-sm ${v.stock === 0 ? "text-destructive" : "text-gold"}`}
                    >
                      {v.stock === 0 ? "Out" : `${v.stock} left`}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="border-t border-stone px-5 py-3">
                <Link href="/admin/inventory" className="inline-flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-gold">
                  <AlertTriangle className="h-3.5 w-3.5" /> Manage inventory
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
