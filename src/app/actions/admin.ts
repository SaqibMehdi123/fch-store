"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { ORDER_TRANSITIONS } from "@/lib/admin/order-machine";

/**
 * Phase 3 — admin mutations. Every action re-verifies the session server-side
 * (the panel layout is only the first gate) before touching the database.
 */

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized — sign in again.");
  return session;
}

export type ActionResult = { ok: true; message?: string } | { ok: false; message: string };

// ---------------------------------------------------------------
// Order state machine
// ---------------------------------------------------------------

const EMAIL_TEMPLATES: Record<string, string> = {
  confirmed: "order_confirmed",
  processing: "order_processing",
  shipped: "order_shipped",
  delivered: "order_delivered",
  cancelled: "order_cancelled",
};

/**
 * setOrderStatus — guarded transition + side effects:
 * - cancelling an unpaid/confirmed order restores reserved stock
 * - shipping accepts optional courier + tracking number
 * - email_log stubs are written (emails go live in Phase 5)
 */
export async function setOrderStatus(input: {
  orderNo: string;
  next: string;
  courierName?: string;
  trackingNumber?: string;
  note?: string;
}): Promise<ActionResult> {
  await requireAdmin();

  const order = await db.order.findUnique({
    where: { orderNo: input.orderNo },
    select: { id: true, status: true, items: { select: { variantId: true, quantity: true } }, email: true },
  });
  if (!order) return { ok: false, message: "Order not found." };

  const allowed = ORDER_TRANSITIONS[order.status] ?? [];
  if (!allowed.includes(input.next)) {
    return { ok: false, message: `Cannot move an order from ${order.status} to ${input.next}.` };
  }

  await db.$transaction(async (tx) => {
    // restore reserved stock when cancelling before dispatch
    if (input.next === "cancelled" && ["awaiting_payment", "confirmed"].includes(order.status)) {
      for (const item of order.items) {
        if (!item.variantId) continue;
        await tx.variant.update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
      }
    }

    await tx.order.update({
      where: { id: order.id },
      data: {
        status: input.next as never,
        ...(input.next === "shipped"
          ? { courierName: input.courierName?.trim() || null, trackingNumber: input.trackingNumber?.trim() || null }
          : {}),
        ...(input.note?.trim() ? { customerNote: input.note.trim() } : {}),
      },
    });

    const template = EMAIL_TEMPLATES[input.next];
    if (template) {
      await tx.emailLog.create({ data: { orderId: order.id, to: order.email, template, status: "queued" } });
    }
  });

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${input.orderNo}`);
  revalidatePath(`/order/${input.orderNo}`);
  return { ok: true, message: `Order moved to ${input.next.replace(/_/g, " ")}.` };
}

// ---------------------------------------------------------------
// Payment verification
// ---------------------------------------------------------------

export async function verifyPayment(input: { paymentId: string; decision: "approve" | "reject"; adminNote?: string }): Promise<ActionResult> {
  await requireAdmin();

  const payment = await db.payment.findUnique({
    where: { id: input.paymentId },
    include: { order: { select: { id: true, orderNo: true, status: true, email: true } } },
  });
  if (!payment) return { ok: false, message: "Payment not found." };
  if (payment.status !== "submitted") return { ok: false, message: "This payment was already reviewed." };
  if (payment.order.status !== "payment_submitted") {
    return { ok: false, message: `Order is ${payment.order.status} — the payment can no longer be decided here.` };
  }

  const approve = input.decision === "approve";
  await db.$transaction([
    db.payment.update({
      where: { id: payment.id },
      data: { status: approve ? "approved" : "rejected", adminNote: input.adminNote?.trim() || null },
    }),
    db.order.update({
      where: { id: payment.order.id },
      data: { status: approve ? "confirmed" : "payment_rejected" },
    }),
    db.emailLog.create({
      data: {
        orderId: payment.order.id,
        to: payment.order.email,
        template: approve ? "order_confirmed" : "payment_rejected",
        status: "queued",
      },
    }),
  ]);

  revalidatePath("/admin");
  revalidatePath("/admin/verification");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${payment.order.orderNo}`);
  revalidatePath(`/order/${payment.order.orderNo}`);
  return {
    ok: true,
    message: approve
      ? `Payment approved — ${payment.order.orderNo} is confirmed.`
      : `Payment rejected — ${payment.order.orderNo} returned to the customer for re-upload.`,
  };
}

// ---------------------------------------------------------------
// Products
// ---------------------------------------------------------------

const variantSchema = z.object({
  id: z.string().optional(),
  colorName: z.string().trim().min(1, "Color name required.").max(40),
  colorHex: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Use a hex color like #1A1A1A."),
  size: z.string().trim().min(1, "Size required.").max(20),
  sku: z.string().trim().max(60).optional(),
  stock: z.number().int().min(0).max(9999),
  lowStockThreshold: z.number().int().min(0).max(99).optional(),
});

const productSchema = z.object({
  id: z.string().optional(),
  categoryId: z.string().min(1, "Pick a category."),
  name: z.string().trim().min(3, "Name must be at least 3 characters.").max(120),
  slug: z.string().trim().max(140).optional(),
  description: z.string().trim().min(10, "Description must be at least 10 characters.").max(5000),
  fabricDetails: z.string().trim().max(2000).optional(),
  price: z.number().min(1, "Price must be at least Rs. 1.").max(9_999_999),
  salePrice: z.number().min(1).max(9_999_999).nullable().optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  images: z
    .array(z.object({ url: z.string().trim().min(1).max(500), publicId: z.string().trim().max(200).optional().nullable() }))
    .max(8, "Up to 8 images.")
    .optional(),
  variants: z.array(variantSchema).min(1, "Add at least one variant."),
});

export type ProductInput = z.infer<typeof productSchema>;

function buildSku(slug: string, color: string, size: string): string {
  const compact = (s: string) => s.replace(/[^a-z0-9]/gi, "").slice(0, 6).toUpperCase();
  return `FCH-${compact(slug)}-${compact(color).slice(0, 3)}-${compact(size).slice(0, 3)}`;
}

export async function upsertProduct(raw: ProductInput): Promise<ActionResult & { id?: string }> {
  await requireAdmin();

  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, message: `${first.path.join(".") || "Form"}: ${first.message}` };
  }
  const data = parsed.data;

  // category must exist
  const category = await db.category.findUnique({ where: { id: data.categoryId }, select: { id: true } });
  if (!category) return { ok: false, message: "Selected category no longer exists." };

  // unique slug (auto from name, suffix on clash)
  let slug = slugify(data.slug || data.name);
  const clash = await db.product.findFirst({ where: { slug, id: data.id ? { not: data.id } : undefined }, select: { id: true } });
  if (clash) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

  try {
    const id = await db.$transaction(async (tx) => {
      const base = {
        categoryId: data.categoryId,
        name: data.name,
        slug,
        description: data.description,
        fabricDetails: data.fabricDetails || null,
        price: data.price,
        salePrice: data.salePrice && data.salePrice > 0 ? data.salePrice : null,
        isFeatured: data.isFeatured ?? false,
        isActive: data.isActive ?? true,
      };

      const product = data.id
        ? await tx.product.update({ where: { id: data.id }, data: base })
        : await tx.product.create({ data: base });

      // images: replace-all (URL/Cloudinary publicId managed in the form)
      if (data.images) {
        await tx.productImage.deleteMany({ where: { productId: product.id } });
        if (data.images.length) {
          await tx.productImage.createMany({
            data: data.images.map((img, i) => ({
              productId: product.id,
              url: img.url,
              publicId: img.publicId || null,
              sortOrder: i,
            })),
          });
        }
      }

      // variants: upsert by id, create new, delete removed
      const keepIds = data.variants.filter((v) => v.id).map((v) => v.id!);
      await tx.variant.deleteMany({ where: { productId: product.id, id: { notIn: keepIds } } });
      for (const v of data.variants) {
        const row = {
          colorName: v.colorName,
          colorHex: v.colorHex,
          size: v.size,
          stock: v.stock,
          lowStockThreshold: v.lowStockThreshold ?? 3,
          sku: v.sku?.trim() || buildSku(slug, v.colorName, v.size),
        };
        if (v.id) {
          await tx.variant.update({ where: { id: v.id }, data: row }).catch(async () => {
            // SKU uniqueness clash — fall back to a suffixed SKU
            await tx.variant.update({ where: { id: v.id! }, data: { ...row, sku: `${row.sku}-${Date.now().toString(36).slice(-4)}` } });
          });
        } else {
          await tx.variant.create({ data: { ...row, productId: product.id } }).catch(async () => {
            await tx.variant.create({ data: { ...row, sku: `${row.sku}-${Date.now().toString(36).slice(-4)}`, productId: product.id } });
          });
        }
      }

      return product.id;
    });

    revalidatePath("/admin/products");
    revalidatePath("/admin/inventory");
    revalidatePath("/");
    return { ok: true, id, message: `Product saved (${slug}).` };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Could not save the product." };
  }
}

export async function setProductActive(id: string, isActive: boolean): Promise<ActionResult> {
  await requireAdmin();
  await db.product.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/products");
  revalidatePath("/");
  return { ok: true, message: isActive ? "Product published." : "Product hidden from the store." };
}

// ---------------------------------------------------------------
// Inventory
// ---------------------------------------------------------------

export async function setStock(variantId: string, stock: number): Promise<ActionResult> {
  await requireAdmin();

  const parsed = z.number().int().min(0).max(9999).safeParse(stock);
  if (!parsed.success) return { ok: false, message: "Stock must be a whole number between 0 and 9999." };

  const variant = await db.variant.findUnique({ where: { id: variantId }, select: { id: true } });
  if (!variant) return { ok: false, message: "Variant not found." };

  await db.variant.update({ where: { id: variantId }, data: { stock: parsed.data } });
  revalidatePath("/admin/inventory");
  revalidatePath("/admin");
  return { ok: true, message: `Stock set to ${parsed.data}.` };
}
