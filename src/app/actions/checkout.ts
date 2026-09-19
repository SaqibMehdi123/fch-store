"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { resolveCoupon } from "@/lib/coupons";
import { effectivePrice, toNumber, phoneCore } from "@/lib/format";
import { isAllowedImage, savePaymentScreenshot, MAX_SCREENSHOT_BYTES } from "@/lib/upload";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { flushOrderEmails, queueOrderEmail } from "@/lib/email/send";
import { headers } from "next/headers";

/**
 * Phase 2 — guest checkout, order creation, payment submission, order lookup.
 * Orders are created in a single DB transaction: stock is validated and
 * decremented atomically (updateMany with a stock guard prevents oversell),
 * item prices are snapped from the DB (never trusted from the client), the
 * coupon is re-validated, and totals are recomputed server-side.
 */

// ---------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------

/** PK mobile numbers: 03XX-XXXXXXX / 03001234567 / +92 3XX XXXXXXX */
const PK_PHONE = /^(?:\+92|0)3\d{2}[-\s]?\d{7}$/;


const itemSchema = z.object({
  variantId: z.string().min(1),
  qty: z.number().int().min(1).max(20),
});

const checkoutSchema = z.object({
  items: z.array(itemSchema).min(1, "Your cart is empty.").max(30),
  fulfillment: z.enum(["delivery", "pickup"]),
  name: z.string().trim().min(3, "Please enter your full name.").max(80),
  phone: z.string().trim().regex(PK_PHONE, "Enter a valid Pakistani mobile number (03XX-XXXXXXX)."),
  email: z.string().trim().email("Enter a valid email address.").max(120),
  address: z.string().trim().max(300).optional(),
  city: z.string().trim().max(80).optional(),
  zoneId: z.string().trim().optional(),
  couponCode: z.string().trim().max(40).optional(),
  customerNote: z.string().trim().max(500).optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type CheckoutResult =
  | { ok: true; orderNo: string; total: number }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

// ---------------------------------------------------------------
// Order number — FCH-#### (sequential, collision-safe)
// ---------------------------------------------------------------

async function nextOrderNumber(bump = 0): Promise<string> {
  // Scan existing order numbers instead of trusting createdAt ordering —
  // imports, clock skew or backdated rows make createdAt unreliable here.
  // `bump` skips past numbers a concurrent checkout may have just taken.
  const rows = await db.order.findMany({
    where: { orderNo: { startsWith: "FCH-" } },
    select: { orderNo: true },
  });
  let max = 1000;
  for (const r of rows) {
    const m = r.orderNo.match(/^FCH-(\d+)$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `FCH-${max + 1 + bump}`;
}

// ---------------------------------------------------------------
// validateCoupon — used by the cart page's Apply button
// ---------------------------------------------------------------

export type CouponValidation =
  | { ok: true; code: string; label: string; discount: number }
  | { ok: false; message: string };

export async function validateCoupon(code: string, subtotal: number): Promise<CouponValidation> {
  const applied = await resolveCoupon(code, Math.max(0, subtotal));
  if (!applied.ok) return { ok: false, message: applied.message };
  return {
    ok: true,
    code: applied.coupon.code,
    label: applied.label,
    discount: applied.discount,
  };
}

// ---------------------------------------------------------------
// createOrder
// ---------------------------------------------------------------

export async function createOrder(raw: CheckoutInput): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, message: "Please fix the highlighted fields.", fieldErrors };
  }
  const input = parsed.data;

  // basic rate limit: 5 orders / 15 min / IP
  const ip = clientIp(await headers());
  if (!rateLimit(`order:${ip}`, 5, 15 * 60_000).ok) {
    return { ok: false, message: "Too many attempts. Please try again in a few minutes." };
  }

  // fulfillment-specific requirements
  if (input.fulfillment === "delivery" && (!input.address || !input.city || !input.zoneId)) {
    return { ok: false, message: "Address, city and delivery zone are required for delivery." };
  }

  const settings = await getSettings();
  const freeThreshold = settings.freeShippingThreshold;

  try {
    // concurrent checkouts can race on the sequential order number — retry
    // with a bumped number when the unique constraint trips (stock guards
    // live inside the transaction, so a retry never double-reserves).
    let result: { orderNo: string; total: number; orderId: string } | undefined;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        result = await db.$transaction(async (tx) => {
      // 1) reserve stock — atomic guard against oversell
      const reserved: { variantId: string; qty: number; name: string; color: string; size: string; unitPrice: number }[] = [];
      const seen = new Set<string>();
      for (const item of input.items) {
        if (seen.has(item.variantId)) throw new Error("Duplicate cart item — please refresh your cart.");
        seen.add(item.variantId);

        const variant = await tx.variant.findFirst({
          where: { id: item.variantId, product: { isActive: true } },
          include: { product: { select: { name: true, price: true, salePrice: true } } },
        });
        if (!variant) throw new Error("Some items in your cart are no longer available.");
        if (variant.stock < item.qty) {
          throw new Error(`Only ${variant.stock} left of ${variant.product.name} (${variant.colorName}, ${variant.size}). Please update your cart.`);
        }

        const updated = await tx.variant.updateMany({
          where: { id: variant.id, stock: { gte: item.qty } },
          data: { stock: { decrement: item.qty } },
        });
        if (updated.count !== 1) {
          throw new Error(`${variant.product.name} (${variant.colorName}, ${variant.size}) just sold out. Please update your cart.`);
        }

        reserved.push({
          variantId: variant.id,
          qty: item.qty,
          name: variant.product.name,
          color: variant.colorName,
          size: variant.size,
          unitPrice: effectivePrice(variant.product.price, variant.product.salePrice),
        });
      }

      // 2) totals — computed from DB prices
      const subtotal = reserved.reduce((n, r) => n + r.unitPrice * r.qty, 0);

      // 3) coupon — re-validated server-side
      let discount = 0;
      let couponId: string | null = null;
      if (input.couponCode) {
        const applied = await resolveCoupon(input.couponCode, subtotal);
        if (!applied.ok) throw new Error(applied.message);
        discount = applied.discount;
        couponId = applied.coupon.id;
      }

      // 4) shipping
      let shippingFee = 0;
      let zoneRate = 0;
      if (input.fulfillment === "delivery") {
        const zone = await tx.deliveryZone.findFirst({ where: { id: input.zoneId, isActive: true } });
        if (!zone) throw new Error("Please choose a valid delivery zone.");
        zoneRate = toNumber(zone.rate);
        shippingFee = subtotal - discount >= freeThreshold ? 0 : zoneRate;
      }

      const total = subtotal - discount + shippingFee;

      // 5) order + items
      const orderNo = await nextOrderNumber(attempt);
      const order = await tx.order.create({
        data: {
          orderNo,
          status: "awaiting_payment",
          fulfillment: input.fulfillment,
          customerName: input.name,
          phone: input.phone,
          email: input.email,
          address: input.fulfillment === "pickup" ? (input.address?.trim() || "In-store pickup") : input.address!,
          city: input.fulfillment === "pickup" ? (input.city?.trim() || "In-store pickup") : input.city!,
          zoneId: input.fulfillment === "delivery" ? input.zoneId! : null,
          subtotal,
          discountAmount: discount,
          couponId,
          shippingFee,
          total,
          customerNote: input.customerNote || null,
          items: {
            create: reserved.map((r) => ({
              productId: null,
              variantId: r.variantId,
              productName: r.name,
              color: r.color,
              size: r.size,
              unitPrice: r.unitPrice,
              quantity: r.qty,
            })),
          },
        },
      });

      // 6) coupon usage
      if (couponId) {
        await tx.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } });
      }

      // 7) emails — queued inside the tx (unique index makes this idempotent);
      //      delivered right after the transaction commits
      await queueOrderEmail(tx, { orderId: order.id, to: input.email, template: "order_placed", dedupeKey: "place" });
      await queueOrderEmail(tx, { orderId: order.id, to: settings.email || "orders@fch.pk", template: "admin_new_order", dedupeKey: "place" });

      return { orderNo, total, orderId: order.id };
        });
        break;
      } catch (e) {
        const code = (e as { code?: string })?.code;
        if (code !== "P2002" || attempt === 2) throw e;
      }
    }

    revalidatePath("/admin");
    // deliver the queued emails (order instructions to the customer + admin
    // notification) — best-effort, never blocks or fails the checkout
    await flushOrderEmails(result!.orderId);
    return { ok: true, orderNo: result!.orderNo, total: result!.total };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not place your order. Please try again.";
    return { ok: false, message };
  }
}

// ---------------------------------------------------------------
// submitPayment — screenshot upload (first upload or re-upload after rejection)
// ---------------------------------------------------------------

const paymentSchema = z.object({
  orderNo: z.string().trim().min(1),
  phone: z.string().trim().min(1),
  transactionRef: z.string().trim().max(80).optional(),
  senderName: z.string().trim().min(2, "Enter the account holder's name.").max(80),
});

export type PaymentSubmitResult =
  | { ok: true; status: "payment_submitted" }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

export async function submitPayment(
  _prev: PaymentSubmitResult | null,
  formData: FormData
): Promise<PaymentSubmitResult> {
  const file = formData.get("screenshot");
  const parsed = paymentSchema.safeParse({
    orderNo: formData.get("orderNo"),
    phone: formData.get("phone"),
    transactionRef: formData.get("transactionRef") || undefined,
    senderName: formData.get("senderName") || undefined,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, message: "Please fix the highlighted fields.", fieldErrors };
  }

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Please attach the payment screenshot.", fieldErrors: { screenshot: "Screenshot is required." } };
  }
  if (file.size > MAX_SCREENSHOT_BYTES) {
    return { ok: false, message: "Screenshot must be 5MB or smaller.", fieldErrors: { screenshot: "File too large (max 5MB)." } };
  }
  if (!isAllowedImage(file.type)) {
    return { ok: false, message: "Only JPG, PNG or WEBP images are accepted.", fieldErrors: { screenshot: "Unsupported file type." } };
  }

  // rate limit uploads: 10 / 15 min / IP
  const ip = clientIp(await headers());
  if (!rateLimit(`payment:${ip}`, 10, 15 * 60_000).ok) {
    return { ok: false, message: "Too many uploads. Please try again in a few minutes." };
  }

  const order = await db.order.findUnique({ where: { orderNo: parsed.data.orderNo } });
  if (!order || phoneCore(order.phone) !== phoneCore(parsed.data.phone)) {
    return { ok: false, message: "Order not found — check the order number and phone number." };
  }
  if (order.status !== "awaiting_payment" && order.status !== "payment_rejected") {
    return { ok: false, message: "A payment screenshot was already received and is under review." };
  }

  try {
    const url = await savePaymentScreenshot(file, order.orderNo);
    const payment = await db.payment.create({
      data: {
        orderId: order.id,
        amount: order.total,
        screenshotUrl: url,
        transactionRef: parsed.data.transactionRef || null,
        senderName: parsed.data.senderName,
        status: "submitted",
      },
    });
    await db.$transaction([
      db.order.update({ where: { id: order.id }, data: { status: "payment_submitted" } }),
      // payment events can repeat (upload → reject → re-upload), so the dedupe
      // key is the payment row id — a NEW upload always notifies again
      db.emailLog.create({
        data: {
          orderId: order.id,
          to: order.email,
          template: "payment_submitted",
          status: "queued",
          dedupeKey: payment.id,
        },
      }),
      db.emailLog.create({
        data: {
          orderId: order.id,
          to: (await getSettings()).email || "orders@fch.pk",
          template: "admin_payment_uploaded",
          status: "queued",
          dedupeKey: payment.id,
        },
      }),
    ]);
    revalidatePath(`/order/${order.orderNo}`);
    revalidatePath("/admin");
    await flushOrderEmails(order.id);
    return { ok: true, status: "payment_submitted" };
  } catch {
    return { ok: false, message: "Upload failed. Please try again." };
  }
}

// ---------------------------------------------------------------
// lookupOrder — track order by order number + phone
// ---------------------------------------------------------------

export type TrackedOrder =
  | {
      found: true;
      orderNo: string;
      status: string;
      fulfillment: string;
      customerName: string;
      city: string;
      createdAt: string;
      subtotal: number;
      discountAmount: number;
      shippingFee: number;
      total: number;
      items: { productName: string; color: string; size: string; unitPrice: number; quantity: number }[];
      payment: { status: string; adminNote: string | null; transactionRef: string | null; createdAt: string } | null;
      canUpload: boolean;
      screenshotDeadline: string;
    }
  | { found: false; message: string };

export async function lookupOrder(orderNo: string, phone: string): Promise<TrackedOrder> {
  const no = (orderNo ?? "").trim().toUpperCase();
  if (!no || !phone.trim()) return { found: false, message: "Enter your order number and phone number." };

  const order = await db.order.findUnique({
    where: { orderNo: no },
    include: {
      items: { orderBy: { productName: "asc" } },
      payments: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!order || phoneCore(order.phone) !== phoneCore(phone)) {
    return { found: false, message: "No order matches that order number and phone number." };
  }

  const settings = await getSettings();
  const deadlineHours = settings.paymentUploadDeadlineHours;
  const deadline = new Date(order.createdAt.getTime() + deadlineHours * 3600_000);

  return {
    found: true,
    orderNo: order.orderNo,
    status: order.status,
    fulfillment: order.fulfillment,
    customerName: order.customerName,
    city: order.city,
    createdAt: order.createdAt.toISOString(),
    subtotal: toNumber(order.subtotal),
    discountAmount: toNumber(order.discountAmount),
    shippingFee: toNumber(order.shippingFee),
    total: toNumber(order.total),
    items: order.items.map((i) => ({
      productName: i.productName,
      color: i.color,
      size: i.size,
      unitPrice: toNumber(i.unitPrice),
      quantity: i.quantity,
    })),
    payment: order.payments[0]
      ? {
          status: order.payments[0].status,
          adminNote: order.payments[0].adminNote,
          transactionRef: order.payments[0].transactionRef,
          createdAt: order.payments[0].createdAt.toISOString(),
        }
      : null,
    canUpload: order.status === "awaiting_payment" || order.status === "payment_rejected",
    screenshotDeadline: deadline.toISOString(),
  };
}
