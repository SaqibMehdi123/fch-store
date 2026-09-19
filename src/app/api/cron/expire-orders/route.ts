import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";

/**
 * Hourly cron (Vercel cron → vercel.json) — expires unpaid orders:
 * 1. awaiting_payment with no screenshot after the upload deadline (24h default)
 * 2. payment_rejected with no re-upload after the deadline
 * Stock reserved by expired orders is restored, email_log rows are written
 * (emails themselves are stubbed until Phase 5).
 *
 * Protected by CRON_SECRET (Authorization: Bearer or ?secret=).
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  const url = new URL(req.url);
  const auth = req.headers.get("authorization") ?? "";
  const provided = auth.replace(/^Bearer\s+/i, "") || url.searchParams.get("secret") || "";
  if (provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getSettings();
  const deadlineMs = Math.max(1, settings.paymentUploadDeadlineHours) * 3600_000;
  const cutoff = new Date(Date.now() - deadlineMs);
  const summary = { expired: 0, cancelled: 0, stockRestored: 0, errors: [] as string[] };

  try {
    // 1) awaiting_payment past deadline
    const staleAwaiting = await db.order.findMany({
      where: { status: "awaiting_payment", createdAt: { lt: cutoff } },
      select: { id: true, orderNo: true, email: true, items: { select: { variantId: true, quantity: true } } },
    });

    for (const order of staleAwaiting) {
      try {
        await db.$transaction(async (tx) => {
          for (const item of order.items) {
            if (!item.variantId) continue;
            const updated = await tx.variant.updateMany({
              where: { id: item.variantId },
              data: { stock: { increment: item.quantity } },
            });
            summary.stockRestored += updated.count * item.quantity;
          }
          await tx.order.update({ where: { id: order.id }, data: { status: "expired" } });
          await tx.emailLog.create({
            data: { to: order.email, orderId: order.id, template: "order_expired", status: "queued" },
          });
        });
        summary.expired += 1;
      } catch (e) {
        summary.errors.push(`${order.orderNo}: ${e instanceof Error ? e.message : "failed"}`);
      }
    }

    // 2) payment_rejected with no re-upload past deadline
    const staleRejected = await db.order.findMany({
      where: { status: "payment_rejected", updatedAt: { lt: cutoff } },
      select: { id: true, orderNo: true, email: true, items: { select: { variantId: true, quantity: true } } },
    });

    for (const order of staleRejected) {
      try {
        await db.$transaction(async (tx) => {
          for (const item of order.items) {
            if (!item.variantId) continue;
            const updated = await tx.variant.updateMany({
              where: { id: item.variantId },
              data: { stock: { increment: item.quantity } },
            });
            summary.stockRestored += updated.count * item.quantity;
          }
          await tx.order.update({ where: { id: order.id }, data: { status: "cancelled" } });
          await tx.emailLog.create({
            data: { to: order.email, orderId: order.id, template: "order_cancelled", status: "queued" },
          });
        });
        summary.cancelled += 1;
      } catch (e) {
        summary.errors.push(`${order.orderNo}: ${e instanceof Error ? e.message : "failed"}`);
      }
    }

    return NextResponse.json({ ok: true, ranAt: new Date().toISOString(), ...summary });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Cron failed", ...summary },
      { status: 500 }
    );
  }
}
