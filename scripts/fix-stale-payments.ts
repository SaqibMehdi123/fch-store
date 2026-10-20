/**
 * One-time repair — resolve Payment rows stuck in "submitted" whose order has
 * already moved on (decision taken from the order tab before the fix that now
 * resolves payments inside setOrderStatus).
 *
 * Rules:
 *   order status in (confirmed, processing, shipped, delivered) → payment approved
 *   order status in (payment_rejected, cancelled, expired)      → payment rejected
 *
 * Idempotent: re-running finds nothing. Usage: bun scripts/fix-stale-payments.ts
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const APPROVE_ORDER_STATUSES = ["confirmed", "processing", "shipped", "delivered"];

const stale = await db.payment.findMany({
  where: { status: "submitted", order: { status: { not: "payment_submitted" } } },
  select: { id: true, order: { select: { orderNo: true, status: true } } },
});

if (stale.length === 0) {
  console.log("No stale payment rows — nothing to do.");
} else {
  for (const p of stale) {
    const approve = APPROVE_ORDER_STATUSES.includes(p.order.status);
    await db.payment.update({
      where: { id: p.id },
      data: {
        status: approve ? "approved" : "rejected",
        adminNote: approve ? "Approved from the order page." : "Decided from the order page.",
      },
    });
    console.log(`${approve ? "approved" : "rejected"}  payment for ${p.order.orderNo} (order status: ${p.order.status})`);
  }
  console.log(`\nResolved ${stale.length} stale payment row(s).`);
}

await db.$disconnect();
