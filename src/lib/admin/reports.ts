import { db } from "@/lib/db";
import { toNumber } from "@/lib/format";

/**
 * Phase 5 — reports data layer. Server-only; consumed by the reports API
 * route and the orders CSV export.
 *
 * Sales figures only count money-verified orders (confirmed → delivered);
 * awaiting/submitted orders are pending, cancelled/expired/rejected are dead.
 */

export const SALES_STATUSES = ["confirmed", "processing", "shipped", "delivered"] as const;

export type Bucket = "day" | "week" | "month";

export type ReportsRange = { from: Date; to: Date; bucket: Bucket };

export function resolveRange(params: { from?: string | null; to?: string | null; bucket?: string | null }): ReportsRange {
  const now = new Date();
  const defaultFrom = new Date(now.getTime() - 29 * 24 * 3600_000);
  const parse = (v?: string | null, fallback?: Date) => {
    if (!v) return fallback ?? defaultFrom;
    const d = new Date(`${v}T00:00:00`);
    return Number.isNaN(d.getTime()) ? (fallback ?? defaultFrom) : d;
  };
  const from = parse(params.from);
  const to = parse(params.to, now);
  // include the whole "to" day
  const toEnd = new Date(to.getTime() + 24 * 3600_000 - 1_000);
  const bucket: Bucket = params.bucket === "week" || params.bucket === "month" ? params.bucket : "day";
  return { from, to: toEnd, bucket };
}

function bucketKey(d: Date, bucket: Bucket): { key: string; label: string } {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  if (bucket === "month") {
    return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: `${months[d.getMonth()]} '${String(d.getFullYear()).slice(2)}` };
  }
  if (bucket === "week") {
    // ISO week start (Monday)
    const day = (d.getDay() + 6) % 7;
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - day);
    return { key: start.toISOString().slice(0, 10), label: `wk ${String(start.getDate()).padStart(2, "0")} ${months[start.getMonth()]}` };
  }
  return { key: d.toISOString().slice(0, 10), label: `${String(d.getDate()).padStart(2, "0")} ${months[d.getMonth()]}` };
}

export type SalesSeries = { key: string; label: string; revenue: number; orders: number; units: number };

export async function getReportsData(range: ReportsRange) {
  const { from, to, bucket } = range;
  const createdInRange = { gte: from, lte: to };

  // ---- sales series -------------------------------------------------------
  const salesOrders = await db.order.findMany({
    where: { createdAt: createdInRange, status: { in: [...SALES_STATUSES] } },
    select: { createdAt: true, total: true, items: { select: { quantity: true } } },
  });

  const buckets = new Map<string, SalesSeries>();
  const ensure = (d: Date) => {
    const { key, label } = bucketKey(d, bucket);
    if (!buckets.has(key)) buckets.set(key, { key, label, revenue: 0, orders: 0, units: 0 });
    return buckets.get(key)!;
  };
  for (const o of salesOrders) {
    const b = ensure(o.createdAt);
    b.revenue += toNumber(o.total);
    b.orders += 1;
    b.units += o.items.reduce((n, i) => n + i.quantity, 0);
  }
  const series = [...buckets.values()].sort((a, b) => (a.key < b.key ? -1 : 1));

  const totals = {
    revenue: series.reduce((n, b) => n + b.revenue, 0),
    orders: series.reduce((n, b) => n + b.orders, 0),
    units: series.reduce((n, b) => n + b.units, 0),
    avgOrder: series.reduce((n, b) => n + b.revenue, 0) / Math.max(1, series.reduce((n, b) => n + b.orders, 0)),
  };

  // ---- top products -------------------------------------------------------
  const items = await db.orderItem.findMany({
    where: { order: { createdAt: createdInRange, status: { in: [...SALES_STATUSES] } } },
    select: { productName: true, quantity: true, unitPrice: true },
  });
  const byProduct = new Map<string, { name: string; units: number; revenue: number }>();
  for (const it of items) {
    const row = byProduct.get(it.productName) ?? { name: it.productName, units: 0, revenue: 0 };
    row.units += it.quantity;
    row.revenue += toNumber(it.unitPrice) * it.quantity;
    byProduct.set(it.productName, row);
  }
  const topProducts = [...byProduct.values()].sort((a, b) => b.revenue - a.revenue || b.units - a.units).slice(0, 10);

  // ---- category share -----------------------------------------------------
  const catItems = await db.orderItem.findMany({
    where: { order: { createdAt: createdInRange, status: { in: [...SALES_STATUSES] } }, variantId: { not: null } },
    select: {
      quantity: true,
      unitPrice: true,
      variant: { select: { product: { select: { category: { select: { name: true } } } } } },
    },
  });
  const byCategory = new Map<string, number>();
  for (const it of catItems) {
    const name = it.variant?.product.category.name ?? "Uncategorised";
    byCategory.set(name, (byCategory.get(name) ?? 0) + toNumber(it.unitPrice) * it.quantity);
  }
  const categoryShare = [...byCategory.entries()]
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue);

  // ---- coupon usage -------------------------------------------------------
  const couponOrders = await db.order.groupBy({
    by: ["couponId"],
    where: { createdAt: createdInRange, couponId: { not: null } },
    _count: { _all: true },
    _sum: { discountAmount: true },
  });
  const couponIds = couponOrders.map((c) => c.couponId).filter((x): x is string => !!x);
  const coupons = couponIds.length
    ? await db.coupon.findMany({ where: { id: { in: couponIds } }, select: { id: true, code: true, type: true, value: true } })
    : [];
  const couponUsage = couponOrders
    .map((c) => {
      const meta = coupons.find((x) => x.id === c.couponId);
      return {
        code: meta?.code ?? "(deleted)",
        type: meta?.type ?? null,
        value: meta?.value ?? null,
        orders: c._count._all,
        discountGiven: toNumber(c._sum.discountAmount),
      };
    })
    .sort((a, b) => b.orders - a.orders);

  // ---- low stock ----------------------------------------------------------
  const lowStock = await db.variant.findMany({
    where: { product: { isActive: true } },
    select: {
      id: true,
      stock: true,
      lowStockThreshold: true,
      colorName: true,
      size: true,
      sku: true,
      product: { select: { name: true, slug: true } },
    },
    orderBy: { stock: "asc" },
  });
  const lowStockRows = lowStock
    .filter((v) => v.stock <= v.lowStockThreshold)
    .slice(0, 20)
    .map((v) => ({
      id: v.id,
      product: v.product.name,
      slug: v.product.slug,
      color: v.colorName,
      size: v.size,
      sku: v.sku,
      stock: v.stock,
      threshold: v.lowStockThreshold,
    }));

  // ---- funnel (all statuses in range, for context) ------------------------
  const statusCounts = await db.order.groupBy({
    by: ["status"],
    where: { createdAt: createdInRange },
    _count: { _all: true },
  });

  return {
    range: { from: from.toISOString(), to: to.toISOString(), bucket },
    series,
    totals,
    topProducts,
    categoryShare,
    couponUsage,
    lowStock: lowStockRows,
    statusCounts: statusCounts.map((s) => ({ status: s.status, count: s._count._all })),
  };
}

export type ReportsData = Awaited<ReturnType<typeof getReportsData>>;
