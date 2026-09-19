import { db } from "@/lib/db";
import { toNumber } from "@/lib/format";
import type { Coupon } from "@prisma/client";

/**
 * Coupon resolution — shared by cart validation and order creation so the
 * same rules (active window, min order, usage limit, cap) apply everywhere.
 * Discounts apply to the merchandise subtotal; shipping is excluded.
 */
export type CouponResult =
  | { ok: true; coupon: Coupon; discount: number; label: string }
  | { ok: false; message: string };

export async function resolveCoupon(code: string | null | undefined, subtotal: number): Promise<CouponResult> {
  const trimmed = (code ?? "").trim().toUpperCase();
  if (!trimmed) return { ok: false, message: "Enter a coupon code." };

  const coupon = await db.coupon.findUnique({ where: { code: trimmed } });
  if (!coupon || !coupon.isActive) return { ok: false, message: "This coupon code is not valid." };

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) return { ok: false, message: "This coupon is not active yet." };
  if (coupon.expiresAt && coupon.expiresAt < now) return { ok: false, message: "This coupon has expired." };
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return { ok: false, message: "This coupon has reached its usage limit." };
  }
  if (coupon.minOrderAmount && subtotal < toNumber(coupon.minOrderAmount)) {
    return { ok: false, message: `This coupon requires a minimum order of Rs. ${toNumber(coupon.minOrderAmount).toLocaleString("en-US")}.` };
  }

  const value = toNumber(coupon.value);
  let discount = coupon.type === "percent" ? (subtotal * value) / 100 : value;
  if (coupon.maxDiscount) discount = Math.min(discount, toNumber(coupon.maxDiscount));
  discount = Math.min(Math.round(discount), subtotal);

  return {
    ok: true,
    coupon,
    discount,
    label: coupon.type === "percent" ? `${value}% off` : `Rs. ${value.toLocaleString("en-US")} off`,
  };
}
