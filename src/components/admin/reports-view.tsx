"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download } from "lucide-react";
import { formatPKR, formatDate } from "@/lib/format";
import type { ReportsData } from "@/lib/admin/reports";

const GOLD = "#B08D57";
const CHARCOAL = "#1A1A1A";
const PIE_COLORS = ["#B08D57", "#1A1A1A", "#8C7A5B", "#C9B08C", "#5D5647", "#D9C7A7", "#3E3A33", "#A98F67"];

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function compactRs(n: number): string {
  if (n >= 100_000) return `Rs ${Math.round(n / 1000)}k`;
  if (n >= 1_000) return `Rs ${(n / 1000).toFixed(1)}k`;
  return `Rs ${Math.round(n)}`;
}

const card = "rounded-sm border border-stone bg-card p-5";
const label = "font-display text-xl";

function Preset({ days, active, onPick }: { days: number; active: boolean; onPick: (from: string, to: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => {
        const to = new Date();
        const from = new Date(to.getTime() - (days - 1) * 24 * 3600_000);
        onPick(isoDay(from), isoDay(to));
      }}
      className={`rounded-full border px-3 py-1 text-xs uppercase tracking-wider transition-colors ${
        active ? "border-charcoal bg-charcoal text-ivory" : "border-stone bg-card text-muted-foreground hover:border-gold"
      }`}
    >
      {days}d
    </button>
  );
}

export function ReportsView() {
  const [from, setFrom] = useState(() => isoDay(new Date(Date.now() - 29 * 24 * 3600_000)));
  const [to, setTo] = useState(() => isoDay(new Date()));
  const [bucket, setBucket] = useState<"day" | "week" | "month">("day");
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState<{ from: string; to: string; bucket: string }>({ from, to, bucket });

  useEffect(() => {
    let live = true;
    (async () => {
      setLoading(true);
      try {
        const qs = new URLSearchParams({ from: applied.from, to: applied.to, bucket: applied.bucket });
        const res = await fetch(`/api/admin/reports?${qs}`, { cache: "no-store" });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `Request failed (${res.status})`);
        const json = (await res.json()) as ReportsData;
        if (live) {
          setData(json);
          setError(null);
        }
      } catch (e) {
        if (live) setError(e instanceof Error ? e.message : "Could not load reports");
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, [applied]);

  const exportHref = useMemo(() => `/api/admin/orders/export?from=${applied.from}&to=${applied.to}`, [applied]);

  const isPresetActive = (days: number) => {
    const toD = isoDay(new Date());
    const fromD = isoDay(new Date(Date.now() - (days - 1) * 24 * 3600_000));
    return applied.from === fromD && applied.to === toD;
  };

  const maxProductRevenue = Math.max(1, ...(data?.topProducts.map((p) => p.revenue) ?? [1]));

  return (
    <div>
      {/* controls */}
      <div className="flex flex-wrap items-center gap-2">
        {[7, 30, 90, 365].map((d) => (
          <Preset
            key={d}
            days={d}
            active={isPresetActive(d)}
            onPick={(f, t) => {
              setFrom(f);
              setTo(t);
              setApplied({ from: f, to: t, bucket });
            }}
          />
        ))}
        <div className="ml-1 flex items-center gap-2">
          <input
            type="date"
            value={from}
            max={to}
            onChange={(e) => setFrom(e.target.value)}
            className="h-9 rounded-sm border border-stone bg-card px-2 text-xs"
            aria-label="From date"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <input
            type="date"
            value={to}
            min={from}
            onChange={(e) => setTo(e.target.value)}
            className="h-9 rounded-sm border border-stone bg-card px-2 text-xs"
            aria-label="To date"
          />
          <select
            value={bucket}
            onChange={(e) => setBucket(e.target.value as "day" | "week" | "month")}
            className="h-9 rounded-sm border border-stone bg-card px-2 text-xs"
            aria-label="Group by"
          >
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
          </select>
          <button
            type="button"
            onClick={() => setApplied({ from, to, bucket })}
            className="h-9 rounded-sm border border-charcoal bg-charcoal px-4 text-xs uppercase tracking-wider text-ivory transition-colors hover:border-gold"
          >
            Apply
          </button>
          <a
            href={exportHref}
            className="flex h-9 items-center gap-1.5 rounded-sm border border-stone bg-card px-3 text-xs uppercase tracking-wider text-charcoal transition-colors hover:border-gold"
          >
            <Download className="h-3.5 w-3.5" /> CSV
          </a>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* KPI row */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className={card}>
          <p className="label-caps text-muted-foreground">Revenue (paid)</p>
          <p className={`${label} mt-1`}>{data ? formatPKR(data.totals.revenue) : "—"}</p>
        </div>
        <div className={card}>
          <p className="label-caps text-muted-foreground">Paid orders</p>
          <p className={`${label} mt-1`}>{data ? data.totals.orders : "—"}</p>
        </div>
        <div className={card}>
          <p className="label-caps text-muted-foreground">Units sold</p>
          <p className={`${label} mt-1`}>{data ? data.totals.units : "—"}</p>
        </div>
        <div className={card}>
          <p className="label-caps text-muted-foreground">Avg order value</p>
          <p className={`${label} mt-1`}>{data ? formatPKR(Math.round(data.totals.avgOrder)) : "—"}</p>
        </div>
      </div>

      {/* revenue + orders charts */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className={card}>
          <p className="label-caps text-muted-foreground">Sales by {bucket}</p>
          <div className="mt-3 h-64">
            {data && data.series.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.series} margin={{ top: 4, right: 8, left: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={GOLD} stopOpacity={0.45} />
                      <stop offset="100%" stopColor={GOLD} stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7E2DA" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6E6A61" }} tickLine={false} axisLine={{ stroke: "#E7E2DA" }} />
                  <YAxis tickFormatter={compactRs} tick={{ fontSize: 11, fill: "#6E6A61" }} tickLine={false} axisLine={false} width={78} />
                  <Tooltip formatter={(v: number) => [formatPKR(v), "Revenue"]} labelStyle={{ color: CHARCOAL }} contentStyle={{ borderRadius: 2, borderColor: "#E7E2DA", fontSize: 12 }} />
                  <Area type="monotone" dataKey="revenue" stroke={GOLD} strokeWidth={2} fill="url(#revFill)" name="Revenue" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart loading={loading} />
            )}
          </div>
        </div>

        <div className={card}>
          <p className="label-caps text-muted-foreground">Paid orders by {bucket}</p>
          <div className="mt-3 h-64">
            {data && data.series.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.series} margin={{ top: 4, right: 8, left: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7E2DA" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6E6A61" }} tickLine={false} axisLine={{ stroke: "#E7E2DA" }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#6E6A61" }} tickLine={false} axisLine={false} width={34} />
                  <Tooltip contentStyle={{ borderRadius: 2, borderColor: "#E7E2DA", fontSize: 12 }} />
                  <Bar dataKey="orders" name="Orders" fill={CHARCOAL} radius={[2, 2, 0, 0]} maxBarSize={34} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart loading={loading} />
            )}
          </div>
        </div>
      </div>

      {/* top products + category share */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className={card}>
          <p className="label-caps text-muted-foreground">Top products — revenue</p>
          <div className="mt-4 space-y-3">
            {data && data.topProducts.length > 0 ? (
              data.topProducts.map((p) => (
                <div key={p.name}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate">{p.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {p.units} units · <span className="text-gold">{formatPKR(p.revenue)}</span>
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-stone/60">
                    <div className="h-1.5 rounded-full bg-gold" style={{ width: `${Math.max(3, (p.revenue / maxProductRevenue) * 100)}%` }} />
                  </div>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">{loading ? "Loading…" : "No paid orders in this range."}</p>
            )}
          </div>
        </div>

        <div className={card}>
          <p className="label-caps text-muted-foreground">Category share — revenue</p>
          <div className="mt-3 h-64">
            {data && data.categoryShare.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.categoryShare}
                    dataKey="revenue"
                    nameKey="name"
                    innerRadius="52%"
                    outerRadius="80%"
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {data.categoryShare.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatPKR(v)} contentStyle={{ borderRadius: 2, borderColor: "#E7E2DA", fontSize: 12 }} />
                  <Legend iconType="circle" formatter={(value) => <span style={{ fontSize: 12, color: "#4A463E" }}>{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart loading={loading} />
            )}
          </div>
        </div>
      </div>

      {/* coupons + low stock */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className={card}>
          <p className="label-caps text-muted-foreground">Coupon usage in range</p>
          {data && data.couponUsage.length > 0 ? (
            <table className="mt-3 w-full text-sm">
              <thead>
                <tr className="border-b border-stone text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-2 font-medium">Code</th>
                  <th className="py-2 font-medium">Orders</th>
                  <th className="py-2 text-right font-medium">Discount given</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone">
                {data.couponUsage.map((c) => (
                  <tr key={c.code}>
                    <td className="py-2 font-medium">{c.code}</td>
                    <td className="py-2">{c.orders}</td>
                    <td className="py-2 text-right">{formatPKR(c.discountGiven)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">{loading ? "Loading…" : "No coupons used in this range."}</p>
          )}
        </div>

        <div className={card}>
          <p className="label-caps text-muted-foreground">Low stock — restock soon</p>
          {data && data.lowStock.length > 0 ? (
            <div className="mt-3 max-h-72 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="py-2 font-medium">Product</th>
                    <th className="py-2 font-medium">Variant</th>
                    <th className="py-2 text-right font-medium">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone">
                  {data.lowStock.map((v) => (
                    <tr key={v.id}>
                      <td className="py-2">
                        {v.product}
                        <span className="text-xs text-muted-foreground"> · {v.sku}</span>
                      </td>
                      <td className="py-2 text-muted-foreground">
                        {v.color}, {v.size}
                      </td>
                      <td className={`py-2 text-right font-medium ${v.stock === 0 ? "text-red-600" : "text-gold"}`}>
                        {v.stock === 0 ? "Out" : `${v.stock} left`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">{loading ? "Loading…" : "Everything is comfortably in stock."}</p>
          )}
        </div>
      </div>

      {/* status funnel */}
      {data && data.statusCounts.length > 0 && (
        <div className={`${card} mt-4`}>
          <p className="label-caps text-muted-foreground">All orders in range — by status</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {data.statusCounts
              .sort((a, b) => b.count - a.count)
              .map((s) => (
                <span key={s.status} className="rounded-full border border-stone bg-background px-3 py-1 text-xs capitalize text-muted-foreground">
                  {s.status.replace(/_/g, " ")} <strong className="text-charcoal">{s.count}</strong>
                </span>
              ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Range {formatDate(applied.from)} – {formatDate(applied.to)}. Revenue counts money-verified orders only
            (confirmed, processing, shipped, delivered).
          </p>
        </div>
      )}
    </div>
  );
}

function EmptyChart({ loading }: { loading: boolean }) {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      {loading ? "Loading…" : "No paid orders in this range."}
    </div>
  );
}
