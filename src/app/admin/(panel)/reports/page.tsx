import type { Metadata } from "next";
import { ReportsView } from "@/components/admin/reports-view";

export const metadata: Metadata = {
  title: "Reports",
  robots: { index: false, follow: false },
};

/**
 * Phase 5 — Reports. Sales by day/week/month, top products, category share,
 * coupon usage, low stock and the orders CSV export. Data is fetched from
 * the session-gated /api/admin/reports endpoint so the range/bucket controls
 * work without full page reloads.
 */
export default function AdminReportsPage() {
  return (
    <div className="animate-fade-in">
      <p className="label-caps text-gold">Configuration</p>
      <h1 className="mt-1 font-display text-3xl">Reports</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Sales performance over any date range — group by day, week or month, drill into the
        best-selling pieces and export the raw orders as CSV for Excel.
      </p>
      <section className="mt-6">
        <ReportsView />
      </section>
    </div>
  );
}
