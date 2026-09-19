import { db } from "@/lib/db";
import { toNumber } from "@/lib/format";
import type { OrderStatus, PaymentStatus, ReviewStatus } from "@prisma/client";

/**
 * Phase 3 — admin read layer. Server-only (imports @/lib/db); every function
 * is called from server components inside the gated /admin panel layout.
 */

export const PAGE_SIZE = 20;

/** Statuses that represent "money received / order moving forward". */
export const PAID_STATUSES: OrderStatus[] = ["confirmed", "processing", "shipped", "delivered"];

// ---------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------

export type DashboardStats = {
  todaySales: number;
  todayOrders: number;
  orders7d: number;
  pendingVerifications: number;
  lowStockCount: number;
  outOfStockCount: number;
  byStatus: Record<string, number>;
  recent: {
    orderNo: string;
    customerName: string;
    city: string;
    status: OrderStatus;
    total: number;
    createdAt: Date;
    itemCount: number;
  }[];
  lowStock: { sku: string; productName: string; color: string; size: string; stock: number; threshold: number }[];
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600_000);

  const [todayAgg, orders7d, pendingVerifications, statusGroups, recent, lowVariants, totalVariants, outVariants] =
    await Promise.all([
      db.order.aggregate({
        where: { createdAt: { gte: startOfToday }, status: { in: PAID_STATUSES } },
        _sum: { total: true },
        _count: true,
      }),
      db.order.count({ where: { createdAt: { gte: weekAgo } } }),
      db.payment.count({ where: { status: "submitted" } }),
      db.order.groupBy({ by: ["status"], _count: true }),
      db.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          orderNo: true,
          customerName: true,
          city: true,
          status: true,
          total: true,
          createdAt: true,
          _count: { select: { items: true } },
        },
      }),
      db.variant.findMany({
        where: { stock: { lte: 3 } },
        orderBy: { stock: "asc" },
        take: 6,
        include: { product: { select: { name: true } } },
      }),
      db.variant.count(),
      db.variant.count({ where: { stock: 0 } }),
    ]);

  const byStatus: Record<string, number> = {};
  for (const g of statusGroups) byStatus[g.status] = g._count;

  return {
    todaySales: toNumber(todayAgg._sum.total),
    todayOrders: todayAgg._count,
    orders7d,
    pendingVerifications,
    lowStockCount: lowVariants.length,
    outOfStockCount: outVariants,
    byStatus,
    recent: recent.map((o) => ({
      orderNo: o.orderNo,
      customerName: o.customerName,
      city: o.city,
      status: o.status,
      total: toNumber(o.total),
      createdAt: o.createdAt,
      itemCount: o._count.items,
    })),
    lowStock: lowVariants.map((v) => ({
      sku: v.sku,
      productName: v.product.name,
      color: v.colorName,
      size: v.size,
      stock: v.stock,
      threshold: v.lowStockThreshold,
    })),
  };
}

// ---------------------------------------------------------------
// Orders
// ---------------------------------------------------------------

export type AdminOrderRow = {
  id: string;
  orderNo: string;
  status: OrderStatus;
  fulfillment: string;
  customerName: string;
  city: string;
  total: number;
  createdAt: Date;
  itemCount: number;
  paymentStatus: PaymentStatus | null;
};

export async function listAdminOrders(opts: {
  status?: string;
  q?: string;
  page?: number;
}): Promise<{ rows: AdminOrderRow[]; total: number; page: number; pages: number }> {
  const page = Math.max(1, opts.page ?? 1);
  const where = {
    ...(opts.status && opts.status !== "all" ? { status: opts.status as OrderStatus } : {}),
    ...(opts.q
      ? {
          OR: [
            { orderNo: { contains: opts.q, mode: "insensitive" as const } },
            { customerName: { contains: opts.q, mode: "insensitive" as const } },
            { phone: { contains: opts.q } },
            { email: { contains: opts.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        orderNo: true,
        status: true,
        fulfillment: true,
        customerName: true,
        city: true,
        total: true,
        createdAt: true,
        _count: { select: { items: true } },
        payments: { orderBy: { createdAt: "desc" }, take: 1, select: { status: true } },
      },
    }),
    db.order.count({ where }),
  ]);

  return {
    rows: rows.map((o) => ({
      id: o.id,
      orderNo: o.orderNo,
      status: o.status,
      fulfillment: o.fulfillment,
      customerName: o.customerName,
      city: o.city,
      total: toNumber(o.total),
      createdAt: o.createdAt,
      itemCount: o._count.items,
      paymentStatus: o.payments[0]?.status ?? null,
    })),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function getAdminOrder(orderNo: string) {
  const order = await db.order.findUnique({
    where: { orderNo },
    include: {
      items: { orderBy: { productName: "asc" } },
      payments: { orderBy: { createdAt: "desc" } },
      zone: true,
      coupon: { select: { code: true } },
      emails: { orderBy: { createdAt: "desc" }, take: 6 },
    },
  });
  if (!order) return null;

  return {
    ...order,
    subtotal: toNumber(order.subtotal),
    discountAmount: toNumber(order.discountAmount),
    shippingFee: toNumber(order.shippingFee),
    total: toNumber(order.total),
    items: order.items.map((i) => ({ ...i, unitPrice: toNumber(i.unitPrice) })),
    payments: order.payments.map((p) => ({ ...p, amount: toNumber(p.amount) })),
    zone: order.zone ? { name: order.zone.name, rate: toNumber(order.zone.rate), etaDays: order.zone.etaDays } : null,
  };
}

export type AdminOrder = NonNullable<Awaited<ReturnType<typeof getAdminOrder>>>;

// ---------------------------------------------------------------
// Payment verification queue
// ---------------------------------------------------------------

export async function listVerificationQueue() {
  const rows = await db.payment.findMany({
    where: { status: "submitted" },
    orderBy: { createdAt: "asc" },
    include: {
      order: {
        select: { orderNo: true, total: true, customerName: true, phone: true, email: true, status: true },
      },
    },
  });
  return rows.map((p) => ({
    id: p.id,
    amount: p.amount !== undefined ? toNumber(p.amount) : 0,
    screenshotUrl: p.screenshotUrl,
    transactionRef: p.transactionRef,
    senderName: p.senderName,
    createdAt: p.createdAt,
    orderNo: p.order.orderNo,
    orderStatus: p.order.status,
    customerName: p.order.customerName,
    phone: p.order.phone,
    email: p.order.email,
    orderTotal: toNumber(p.order.total),
  }));
}

export async function listRecentDecisions() {
  const rows = await db.payment.findMany({
    where: { status: { in: ["approved", "rejected"] } },
    orderBy: { updatedAt: "desc" },
    take: 8,
    include: { order: { select: { orderNo: true, customerName: true } } },
  });
  return rows.map((p) => ({
    id: p.id,
    status: p.status,
    adminNote: p.adminNote,
    orderNo: p.order.orderNo,
    customerName: p.order.customerName,
    updatedAt: p.updatedAt,
  }));
}

// ---------------------------------------------------------------
// Products (admin)
// ---------------------------------------------------------------

export async function listAdminProducts(opts: { q?: string; page?: number }) {
  const page = Math.max(1, opts.page ?? 1);
  const where = opts.q
    ? {
        OR: [
          { name: { contains: opts.q, mode: "insensitive" as const } },
          { slug: { contains: opts.q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [rows, total] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        category: { select: { name: true } },
        images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
        variants: { select: { stock: true } },
      },
    }),
    db.product.count({ where }),
  ]);

  return {
    rows: rows.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      categoryName: p.category.name,
      price: toNumber(p.price),
      salePrice: p.salePrice ? toNumber(p.salePrice) : null,
      isActive: p.isActive,
      isFeatured: p.isFeatured,
      image: p.images[0]?.url ?? null,
      stock: p.variants.reduce((n, v) => n + v.stock, 0),
      variantCount: p.variants.length,
    })),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function getAdminProduct(id: string) {
  const product = await db.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: [{ colorName: "asc" }, { size: "asc" }] },
      category: { include: { parent: true } },
    },
  });
  if (!product) return null;
  return {
    ...product,
    price: toNumber(product.price),
    salePrice: product.salePrice ? toNumber(product.salePrice) : null,
    variants: product.variants.map((v) => ({ ...v })),
  };
}

export type AdminProduct = NonNullable<Awaited<ReturnType<typeof getAdminProduct>>>;

/** Category options for the product form — flat list with lineage label. */
export async function getCategoryOptions() {
  const cats = await db.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: { parent: { include: { parent: true } } },
  });
  return cats.map((c) => {
    const path = [c.parent?.parent?.name, c.parent?.name, c.name].filter(Boolean).join(" / ");
    return { id: c.id, label: path || c.name };
  });
}

// ---------------------------------------------------------------
// Inventory
// ---------------------------------------------------------------

export async function listInventory(opts: { q?: string; filter?: string }) {
  const where = {
    ...(opts.q
      ? {
          OR: [
            { sku: { contains: opts.q, mode: "insensitive" as const } },
            { colorName: { contains: opts.q, mode: "insensitive" as const } },
            { product: { name: { contains: opts.q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
    ...(opts.filter === "low" ? { stock: { gt: 0, lte: 3 } } : {}),
    ...(opts.filter === "out" ? { stock: 0 } : {}),
  };

  const rows = await db.variant.findMany({
    where,
    orderBy: [{ stock: "asc" }, { sku: "asc" }],
    take: 200,
    include: { product: { select: { name: true, slug: true } } },
  });

  const [outCount, lowCount, totalCount] = await Promise.all([
    db.variant.count({ where: { stock: 0 } }),
    db.variant.count({ where: { stock: { gt: 0, lte: 3 } } }),
    db.variant.count(),
  ]);

  return {
    rows: rows.map((v) => ({
      id: v.id,
      sku: v.sku,
      productName: v.product.name,
      productSlug: v.product.slug,
      color: v.colorName,
      colorHex: v.colorHex,
      size: v.size,
      stock: v.stock,
      threshold: v.lowStockThreshold,
    })),
    outCount,
    lowCount,
    totalCount,
  };
}

// ---------------------------------------------------------------
// Phase 4 — content & marketing modules
// ---------------------------------------------------------------

export type AdminCouponRow = {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  minOrderAmount: number | null;
  maxDiscount: number | null;
  startsAt: string;
  expiresAt: string | null;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
};

export async function listAdminCoupons(opts: { q?: string } = {}) {
  const q = opts.q?.trim() ?? "";
  const rows = await db.coupon.findMany({
    where: q ? { code: { contains: q, mode: "insensitive" } } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const activeCount = await db.coupon.count({ where: { isActive: true } });

  const mapped: AdminCouponRow[] = rows.map((c) => ({
    id: c.id,
    code: c.code,
    type: c.type === "percent" ? "percent" : "fixed",
    value: toNumber(c.value),
    minOrderAmount: c.minOrderAmount ? toNumber(c.minOrderAmount) : null,
    maxDiscount: c.maxDiscount ? toNumber(c.maxDiscount) : null,
    startsAt: c.startsAt.toISOString(),
    expiresAt: c.expiresAt?.toISOString() ?? null,
    usageLimit: c.usageLimit,
    usedCount: c.usedCount,
    isActive: c.isActive,
  }));
  return { rows: mapped, activeCount, totalCount: mapped.length };
}

export type AdminReviewRow = {
  id: string;
  productName: string;
  productSlug: string;
  name: string;
  email: string;
  rating: number;
  title: string | null;
  body: string;
  isVerifiedPurchase: boolean;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

export async function listAdminReviews(opts: { status?: string } = {}) {
  const status = ["pending", "approved", "rejected"].includes(opts.status ?? "")
    ? (opts.status as ReviewStatus)
    : "pending";

  const [rows, pendingCount, approvedCount, rejectedCount] = await Promise.all([
    db.review.findMany({
      where: { status },
      orderBy: { createdAt: "asc" },
      take: 100,
      include: { product: { select: { name: true, slug: true } } },
    }),
    db.review.count({ where: { status: "pending" } }),
    db.review.count({ where: { status: "approved" } }),
    db.review.count({ where: { status: "rejected" } }),
  ]);

  const mapped: AdminReviewRow[] = rows.map((r) => ({
    id: r.id,
    productName: r.product.name,
    productSlug: r.product.slug,
    name: r.name,
    email: r.email,
    rating: r.rating,
    title: r.title,
    body: r.body,
    isVerifiedPurchase: r.isVerifiedPurchase,
    status: r.status as AdminReviewRow["status"],
    createdAt: r.createdAt.toISOString(),
  }));
  return { rows: mapped, pendingCount, approvedCount, rejectedCount };
}

export type AdminBannerRow = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  linkUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
};

export async function listAdminBanners() {
  const [rows, activeCount] = await Promise.all([
    db.banner.findMany({ orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }] }),
    db.banner.count({ where: { isActive: true } }),
  ]);

  const mapped: AdminBannerRow[] = rows.map((b) => ({
    id: b.id,
    title: b.title,
    subtitle: b.subtitle,
    imageUrl: b.imageUrl,
    linkUrl: b.linkUrl,
    sortOrder: b.sortOrder,
    isActive: b.isActive,
    startsAt: b.startsAt?.toISOString() ?? null,
    endsAt: b.endsAt?.toISOString() ?? null,
  }));
  return { rows: mapped, activeCount, totalCount: mapped.length };
}

export type AdminZoneRow = {
  id: string;
  name: string;
  cities: string;
  rate: number;
  etaDays: number;
  isActive: boolean;
  orderCount: number;
};

export async function listAdminZones() {
  const rows = await db.deliveryZone.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    include: { _count: { select: { orders: true } } },
  });
  const activeCount = await db.deliveryZone.count({ where: { isActive: true } });

  const mapped: AdminZoneRow[] = rows.map((z) => ({
    id: z.id,
    name: z.name,
    cities: z.cities,
    rate: toNumber(z.rate),
    etaDays: z.etaDays,
    isActive: z.isActive,
    orderCount: z._count.orders,
  }));
  return { rows: mapped, activeCount, totalCount: mapped.length };
}

export async function listAdminPages() {
  const rows = await db.page.findMany({ orderBy: { slug: "asc" } });
  return rows.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    isActive: p.isActive,
    contentLength: p.content.length,
    updatedAt: p.updatedAt.toISOString(),
  }));
}

export async function getAdminPage(id: string) {
  return db.page.findUnique({ where: { id } });
}

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin";
  createdAt: string;
};

export async function listTeamMembers() {
  const rows = await db.adminUser.findMany({ orderBy: { createdAt: "asc" } });
  const mapped: TeamMember[] = rows.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role as TeamMember["role"],
    createdAt: u.createdAt.toISOString(),
  }));
  return mapped;
}
