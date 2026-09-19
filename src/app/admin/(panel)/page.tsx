import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Package, TrendingUp, ArrowRight } from "lucide-react";

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
] as const;

const STATUS_LABELS: Record<(typeof STATUS_KEYS)[number], string> = {
  awaiting_payment: "Awaiting Payment",
  payment_submitted: "Under Review",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
};

/**
 * Admin dashboard — Phase 0 shell.
 * TODO(PHASE 3): live sales KPIs, revenue chart, verification queue badge,
 * low-stock alerts and recent orders, all wired to the database.
 */
export default function AdminDashboardPage() {
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
          Go to Payment Verification <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* KPI placeholders — live in Phase 3 */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { icon: TrendingUp, label: "Today's Sales", value: "Rs. 0", note: "Phase 3 wires live data" },
          { icon: Package, label: "Orders (7 days)", value: "0", note: "Phase 3 wires live data" },
          { icon: BadgeCheck, label: "Pending Verifications", value: "0", note: "Phase 3 wires live data" },
        ].map(({ icon: Icon, label, value, note }) => (
          <div key={label} className="border border-stone bg-card p-5 rounded-sm">
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
      <div className="mt-6 border border-stone bg-card rounded-sm">
        <div className="border-b border-stone px-5 py-4">
          <h2 className="font-display text-lg">Orders by Status</h2>
        </div>
        <div className="grid grid-cols-2 gap-px bg-stone/60 sm:grid-cols-3 lg:grid-cols-6">
          {STATUS_KEYS.map((k) => (
            <div key={k} className="bg-card px-5 py-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{STATUS_LABELS[k]}</p>
              <p className="mt-2 font-display text-2xl">0</p>
            </div>
          ))}
        </div>
      </div>

      {/* recent orders empty state */}
      <div className="mt-6 border border-stone bg-card rounded-sm">
        <div className="border-b border-stone px-5 py-4">
          <h2 className="font-display text-lg">Recent Orders</h2>
        </div>
        <div className="px-5 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            No orders yet — once customers check out (Phase 2), orders appear here for processing (Phase 3).
          </p>
        </div>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Dashboard, Payment Verification queue, Orders and Products arrive in <strong>Phase 3</strong>.
      </p>
    </div>
  );
}
