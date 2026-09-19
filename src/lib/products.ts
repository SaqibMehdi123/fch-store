/**
 * FCH — Catalog query layer (server-only).
 * All catalog reads for home / shop / product pages funnel through here so
 * filters, facets and serialization stay consistent.
 *
 * NOTE: prices are stored as Decimal(10,2). Everything crossing the
 * server→client boundary is converted to plain numbers.
 */
import { cache } from "react";
import { db } from "@/lib/db";
import { toNumber } from "@/lib/format";
import type { Prisma, Product, Category } from "@prisma/client";
import type { ShopQuery } from "@/lib/shop-url";

// ---------------------------------------------------------------
// Types
// ---------------------------------------------------------------

export type ColorOption = { name: string; hex: string };

export type VariantOption = {
  id: string;
  color: string;
  colorHex: string;
  size: string;
  stock: number;
  sku: string;
};

export type ReviewItem = {
  id: string;
  name: string;
  rating: number;
  title: string | null;
  body: string;
  verified: boolean;
  date: string; // ISO
};

export type ProductCardData = {
  slug: string;
  name: string;
  categoryName: string;
  categorySlug: string;
  price: number;
  salePrice: number | null;
  image: string;
  imageHover: string | null;
  colors: ColorOption[];
  inStock: boolean;
  isFeatured: boolean;
};

export type ProductDetail = {
  id: string;
  slug: string;
  name: string;
  description: string;
  fabricDetails: string | null;
  price: number;
  salePrice: number | null;
  categoryPath: { name: string; slug: string }[]; // leaf → root (breadcrumb)
  images: string[];
  variants: VariantOption[];
  reviews: ReviewItem[];
  ratingAvg: number;
  ratingCount: number;
  totalStock: number;
};

const PER_PAGE = 12;

// ---------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: { category: true; images: true; variants: true; _count: { select: { items: true } } };
}>;

export const PRODUCT_INCLUDE = {
  category: true,
  images: { orderBy: { sortOrder: "asc" as const } },
  variants: { orderBy: [{ colorName: "asc" as const }, { size: "asc" as const }] },
  _count: { select: { items: true } },
};

function effective(p: Pick<Product, "price" | "salePrice">): number {
  const price = toNumber(p.price);
  const sale = toNumber(p.salePrice);
  return sale > 0 && sale < price ? sale : price;
}

export function toCardData(p: ProductWithRelations): ProductCardData {
  // distinct colors, preserving first-seen order
  const seen = new Set<string>();
  const colors: ColorOption[] = [];
  for (const v of p.variants) {
    if (!seen.has(v.colorName)) {
      seen.add(v.colorName);
      colors.push({ name: v.colorName, hex: v.colorHex });
    }
  }
  return {
    slug: p.slug,
    name: p.name,
    categoryName: p.category.name,
    categorySlug: p.category.slug,
    price: toNumber(p.price),
    salePrice: p.salePrice ? toNumber(p.salePrice) : null,
    image: p.images[0]?.url ?? "",
    imageHover: p.images[1]?.url ?? null,
    colors,
    inStock: p.variants.some((v) => v.stock > 0),
    isFeatured: p.isFeatured,
  };
}

// ---------------------------------------------------------------
// Category tree (also used by header/nav later)
// ---------------------------------------------------------------
export type CategoryNode = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  count: number; // products directly in this category
  children: CategoryNode[];
};

/** Full category tree with per-category product counts. */
export const getCategoryTree = cache(async (): Promise<CategoryNode[]> => {
  const [cats, counts] = await Promise.all([
    db.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    db.product.groupBy({ by: ["categoryId"], where: { isActive: true }, _count: { _all: true } }),
  ]);
  const countMap = new Map(counts.map((c) => [c.categoryId, c._count._all]));

  const build = (parentId: string | null): CategoryNode[] =>
    cats
      .filter((c) => c.parentId === parentId)
      .map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        imageUrl: c.imageUrl,
        count: countMap.get(c.id) ?? 0,
        children: build(c.id),
      }));

  return build(null);
});

/** Resolve a (hierarchical) category slug to it + all descendant category ids. */
export const getCategoryBranch = cache(
  async (slug: string): Promise<{ category: Category; categoryIds: string[] } | null> => {
    const cats = await db.category.findMany({ where: { isActive: true } });
    const root = cats.find((c) => c.slug === slug);
    if (!root) return null;
    const ids = [root.id];
    // expand descendants (tree is small)
    let frontier = [root.id];
    while (frontier.length) {
      const next = cats.filter((c) => c.parentId && frontier.includes(c.parentId)).map((c) => c.id);
      ids.push(...next);
      frontier = next;
    }
    return { category: root, categoryIds: ids };
  }
);

/**
 * Resolve a department (top-level category) for its own listing page.
 * Returns the department's subtree (with counts) + all category ids in scope.
 */
export const getDepartment = cache(
  async (slug: string): Promise<{ root: CategoryNode; categoryIds: string[] } | null> => {
    const [branch, tree] = await Promise.all([getCategoryBranch(slug), getCategoryTree()]);
    if (!branch || branch.category.parentId !== null) return null;
    const root = tree.find((t) => t.slug === slug);
    if (!root) return null;
    return { root, categoryIds: branch.categoryIds };
  }
);

/** Root (top-level ancestor) slug of a category — used by the /category/* redirect. */
export async function getCategoryRootSlug(slug: string): Promise<string | null> {
  const cats = await db.category.findMany({ where: { isActive: true } });
  const byId = new Map(cats.map((c) => [c.id, c]));
  let cur = cats.find((c) => c.slug === slug);
  if (!cur) return null;
  while (cur.parentId) {
    const parent = byId.get(cur.parentId);
    if (!parent) break;
    cur = parent;
  }
  return cur.slug;
}

// ---------------------------------------------------------------
// Shop listing — query parsing/URL helpers live in lib/shop-url.ts
// (client-safe); re-exported here for server pages.
// ---------------------------------------------------------------

export { parseShopParams, shopHref, SORT_OPTIONS } from "@/lib/shop-url";
export type { ShopQuery, SortKey, Availability } from "@/lib/shop-url";

export type ShopResult = {
  items: ProductCardData[];
  total: number;
  page: number;
  pageCount: number;
  perPage: number;
};

export async function listProducts(query: ShopQuery): Promise<ShopResult> {
  const branch = query.categorySlug ? await getCategoryBranch(query.categorySlug) : null;
  const dept = query.department ? await getCategoryBranch(query.department) : null;
  // A department filter that matches nothing (e.g. unknown slug) yields an empty list.
  if (query.department && !dept) {
    return { items: [], total: 0, page: 1, pageCount: 1, perPage: PER_PAGE };
  }

  const and: Prisma.ProductWhereInput[] = [{ isActive: true }];

  if (dept) and.push({ categoryId: { in: dept.categoryIds } });
  if (branch) and.push({ categoryId: { in: branch.categoryIds } });

  // variant-level filters (size / color / availability)
  const variantAnd: Prisma.VariantWhereInput[] = [];
  if (query.sizes.length) variantAnd.push({ size: { in: query.sizes } });
  if (query.colors.length) variantAnd.push({ colorName: { in: query.colors } });
  if (query.availability === "in_stock") variantAnd.push({ stock: { gt: 0 } });
  if (variantAnd.length) and.push({ variants: { some: { AND: variantAnd } } });

  if (query.availability === "on_sale") and.push({ salePrice: { not: null } });

  // price range applies to the effective (sale) price
  if (query.min !== null || query.max !== null) {
    const range: { gte?: number; lte?: number } = {};
    if (query.min !== null) range.gte = query.min;
    if (query.max !== null) range.lte = query.max;
    and.push({
      OR: [{ salePrice: range }, { salePrice: null, price: range }],
    });
  }

  if (query.q) {
    const needle = query.q;
    and.push({
      OR: [
        { name: { contains: needle, mode: "insensitive" } },
        { description: { contains: needle, mode: "insensitive" } },
        { fabricDetails: { contains: needle, mode: "insensitive" } },
        { category: { name: { contains: needle, mode: "insensitive" } } },
      ],
    });
  }

  const where: Prisma.ProductWhereInput = { AND: and };

  // Fetch matches then sort/paginate in memory — price sorting uses the
  // effective (sale) price, which SQL-level orderBy can't express directly.
  // TODO(P3+): switch to ORDER BY COALESCE(sale_price, price) via $queryRaw
  // if the catalog grows beyond a few hundred products.
  const rows = await db.product.findMany({ where, include: PRODUCT_INCLUDE });

  const sort = query.sort;
  rows.sort((a, b) => {
    switch (sort) {
      case "price_asc":
        return effective(a) - effective(b);
      case "price_desc":
        return effective(b) - effective(a);
      case "bestselling":
        // No order history yet — featured first, then newest. Phase 3 swaps
        // this to real units-sold once order_items exist.
        if (b.isFeatured !== a.isFeatured) return b.isFeatured ? 1 : -1;
        return b.createdAt.getTime() - a.createdAt.getTime();
      default:
        return b.createdAt.getTime() - a.createdAt.getTime();
    }
  });

  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / PER_PAGE));
  const page = Math.min(query.page, pageCount);
  const items = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE).map(toCardData);

  return { items, total, page, pageCount, perPage: PER_PAGE };
}

// ---------------------------------------------------------------
// Facets (filter sidebar)
// ---------------------------------------------------------------

const SIZE_ORDER = [
  "S", "M", "L", "XL", "XXL",
  "One Size",
  "30", "32", "34", "36", "38", "40",
  "2-3Y", "4-5Y", "6-7Y", "8-9Y", "10-11Y",
];

export type FilterFacets = {
  sizes: string[];
  colors: ColorOption[];
  priceMin: number;
  priceMax: number;
};

/**
 * Facets for the filter sidebar. When a department slug is given, facets are
 * scoped to that department only — e.g. the Kids page offers kids sizes and
 * only colours that actually occur in the Kids range.
 */
export const getFilterFacets = cache(
  async (departmentSlug?: string | null): Promise<FilterFacets> => {
    let categoryIds: string[] | null = null;
    if (departmentSlug) {
      const branch = await getCategoryBranch(departmentSlug);
      categoryIds = branch?.categoryIds ?? null;
    }

    const productWhere: Prisma.ProductWhereInput = {
      isActive: true,
      ...(categoryIds ? { categoryId: { in: categoryIds } } : {}),
    };

    const [variants, products] = await Promise.all([
      db.variant.findMany({
        where: { product: productWhere },
        distinct: ["size"],
        select: { size: true },
      }),
      db.product.findMany({
        where: productWhere,
        select: { price: true, salePrice: true },
      }),
    ]);

    const sizeRank = new Map(SIZE_ORDER.map((s, i) => [s, i]));
    const sizes = variants
      .map((v) => v.size)
      .sort((a, b) => (sizeRank.get(a) ?? 999) - (sizeRank.get(b) ?? 999) || a.localeCompare(b));

    const colorRows = await db.variant.findMany({
      where: { product: productWhere },
      distinct: ["colorName"],
      select: { colorName: true, colorHex: true },
      orderBy: { colorName: "asc" },
    });

    const prices = products.map(effective);
    return {
      sizes,
      colors: colorRows.map((c) => ({ name: c.colorName, hex: c.colorHex })),
      priceMin: prices.length ? Math.floor(Math.min(...prices)) : 0,
      priceMax: prices.length ? Math.ceil(Math.max(...prices)) : 20000,
    };
  }
);

// ---------------------------------------------------------------
// Product detail
// ---------------------------------------------------------------

export const getProductBySlug = cache(async (slug: string): Promise<ProductDetail | null> => {
  const p = await db.product.findFirst({
    where: { slug, isActive: true },
    include: {
      ...PRODUCT_INCLUDE,
      reviews: {
        where: { status: "approved" },
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, rating: true, title: true, body: true, isVerifiedPurchase: true, createdAt: true },
      },
    },
  });
  if (!p) return null;

  // breadcrumb: leaf → root
  const categoryPath: { name: string; slug: string }[] = [];
  const cats = await db.category.findMany();
  const byId = new Map(cats.map((c) => [c.id, c]));
  let cur: Category | undefined = p.category;
  while (cur) {
    categoryPath.unshift({ name: cur.name, slug: cur.slug });
    cur = cur.parentId ? byId.get(cur.parentId) : undefined;
  }

  const ratingCount = p.reviews.length;
  const ratingAvg = ratingCount
    ? Math.round((p.reviews.reduce((s, r) => s + r.rating, 0) / ratingCount) * 10) / 10
    : 0;

  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description,
    fabricDetails: p.fabricDetails,
    price: toNumber(p.price),
    salePrice: p.salePrice ? toNumber(p.salePrice) : null,
    categoryPath,
    images: p.images.map((i) => i.url),
    variants: p.variants.map((v) => ({
      id: v.id,
      color: v.colorName,
      colorHex: v.colorHex,
      size: v.size,
      stock: v.stock,
      sku: v.sku,
    })),
    reviews: p.reviews.map((r) => ({
      id: r.id,
      name: r.name,
      rating: r.rating,
      title: r.title,
      body: r.body,
      verified: r.isVerifiedPurchase,
      date: r.createdAt.toISOString(),
    })),
    ratingAvg,
    ratingCount,
    totalStock: p.variants.reduce((s, v) => s + v.stock, 0),
  };
});

/** Related products: same leaf category first, then same top-level branch. */
export const getRelatedProducts = cache(async (product: ProductDetail, limit = 4): Promise<ProductCardData[]> => {
  const leaf = product.categoryPath[0]?.slug;
  const root = product.categoryPath[product.categoryPath.length - 1]?.slug;

  const pick = async (slug: string | undefined) => {
    if (!slug) return [];
    const branch = await getCategoryBranch(slug);
    if (!branch) return [];
    const rows = await db.product.findMany({
      where: { isActive: true, categoryId: { in: branch.categoryIds }, slug: { not: product.slug } },
      include: PRODUCT_INCLUDE,
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return rows.map(toCardData);
  };

  let related = await pick(leaf);
  if (related.length < limit && root && root !== leaf) {
    const extra = await pick(root);
    const seen = new Set(related.map((r) => r.slug));
    related = [...related, ...extra.filter((r) => !seen.has(r.slug))].slice(0, limit);
  }
  return related;
});

// ---------------------------------------------------------------
// Home page data
// ---------------------------------------------------------------

export type HomeData = {
  banners: { id: string; title: string; subtitle: string | null; imageUrl: string; linkUrl: string | null }[];
  categories: CategoryNode[]; // top-level only
  newArrivals: ProductCardData[];
  onSale: ProductCardData[];
  featured: ProductCardData[];
};

export const getHomeData = cache(async (): Promise<HomeData> => {
  const now = new Date();
  const [banners, tree, newest, sale, featured] = await Promise.all([
    db.banner.findMany({
      where: {
        isActive: true,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
      },
      orderBy: { sortOrder: "asc" },
    }),
    getCategoryTree(),
    db.product.findMany({
      where: { isActive: true },
      include: PRODUCT_INCLUDE,
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    db.product.findMany({
      where: { isActive: true, salePrice: { not: null } },
      include: PRODUCT_INCLUDE,
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    db.product.findMany({
      where: { isActive: true, isFeatured: true },
      include: PRODUCT_INCLUDE,
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  return {
    banners: banners.map((b) => ({
      id: b.id,
      title: b.title,
      subtitle: b.subtitle,
      imageUrl: b.imageUrl,
      linkUrl: b.linkUrl,
    })),
    categories: tree,
    newArrivals: newest.map(toCardData),
    onSale: sale.map(toCardData),
    featured: featured.map(toCardData),
  };
});
