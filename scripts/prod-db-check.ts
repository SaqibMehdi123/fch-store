/**
 * Production DB sanity check — counts rows in core tables.
 * Usage: DATABASE_URL=<pooled> DIRECT_URL=<direct> bun scripts/prod-db-check.ts
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const [products, variants, admins, settings, zones, pages, orders, banners, coupons] =
  await Promise.all([
    db.product.count(),
    db.variant.count(),
    db.adminUser.count(),
    db.setting.count(),
    db.deliveryZone.count(),
    db.page.count(),
    db.order.count(),
    db.banner.count(),
    db.coupon.count(),
  ]);

console.log("=== Neon production DB content ===");
console.log({ products, variants, admins, settings, zones, pages, orders, banners, coupons });

const admin = await db.adminUser.findFirst({ select: { email: true } });
console.log("admin account:", admin?.email ?? "NONE — seed required!");

await db.$disconnect();
