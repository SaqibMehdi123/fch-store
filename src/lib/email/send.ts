import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { toNumber } from "@/lib/format";
import nodemailer from "nodemailer";
import {
  renderOrderEmail,
  renderContactEmail,
  IS_ORDER_TEMPLATE,
  type TemplateName,
  type OrderEmailContext,
} from "./templates";

/**
 * Phase 5 — email delivery.
 *
 * Flow: mutations queue rows in email_log (status "queued") inside the same
 * DB transaction as the business change; after the transaction commits they
 * call flushOrderEmails() / flushEmailLog() which render the branded template
 * and hand it to the configured transport:
 *
 *   RESEND_API_KEY  → Resend HTTP API (recommended, works on Vercel)
 *   SMTP_HOST       → SMTP via nodemailer (any provider)
 *   neither         → preview transport: marked "sent" with a note, full
 *                     HTML stored for the Admin → Email Log preview
 *
 * Idempotency: a unique index on (order_id, template, dedupe_key) makes
 * duplicate queueing impossible at the DB level; only "queued" rows are
 * ever sent, so retries never double-send. Failures are logged on the row
 * and can be retried from the admin email log.
 */

const PREVIEW_NOTE =
  "sent via preview transport — no email provider configured (set RESEND_API_KEY or SMTP_HOST to deliver for real)";

export function appUrl(): string {
  return (process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

// -----------------------------------------------------------------
// transports
// -----------------------------------------------------------------

type TransportResult = { ok: true; via: string } | { ok: false; error: string };

async function deliver(to: string, subject: string, html: string): Promise<TransportResult> {
  const from = process.env.EMAIL_FROM ?? "FCH <onboarding@resend.dev>";

  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from, to: [to], subject, html }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        return { ok: false, error: `Resend ${res.status}: ${body.slice(0, 300)}` };
      }
      return { ok: true, via: "resend" };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Resend request failed" };
    }
  }

  if (process.env.SMTP_HOST) {
    try {
      const mailer = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === "true",
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
      });
      await mailer.sendMail({ from, to, subject, html });
      return { ok: true, via: "smtp" };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "SMTP send failed" };
    }
  }

  return { ok: true, via: "preview" };
}

// -----------------------------------------------------------------
// order context loader
// -----------------------------------------------------------------

export async function loadOrderContext(orderId: string): Promise<OrderEmailContext> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      items: { orderBy: { productName: "asc" } },
      payments: { orderBy: { createdAt: "desc" }, take: 1 },
      coupon: { select: { code: true } },
    },
  });
  if (!order) throw new Error(`Order ${orderId} not found while rendering email`);

  return {
    orderNo: order.orderNo,
    status: order.status,
    customerName: order.customerName,
    customerEmail: order.email,
    phone: order.phone,
    address: order.address,
    city: order.city,
    fulfillment: order.fulfillment,
    subtotal: toNumber(order.subtotal),
    discountAmount: toNumber(order.discountAmount),
    shippingFee: toNumber(order.shippingFee),
    total: toNumber(order.total),
    couponCode: order.coupon?.code ?? null,
    courierName: order.courierName,
    trackingNumber: order.trackingNumber,
    customerNote: order.customerNote,
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((i) => ({
      productName: i.productName,
      color: i.color,
      size: i.size,
      unitPrice: toNumber(i.unitPrice),
      quantity: i.quantity,
    })),
    payment: order.payments[0]
      ? {
          amount: toNumber(order.payments[0].amount),
          transactionRef: order.payments[0].transactionRef,
          senderName: order.payments[0].senderName,
          adminNote: order.payments[0].adminNote,
        }
      : null,
  };
}

// -----------------------------------------------------------------
// queue flush
// -----------------------------------------------------------------

/** Send one queued log row (renders template, delivers, records result). */
export async function sendQueuedEmail(emailLogId: string): Promise<{ ok: boolean; error?: string }> {
  const row = await db.emailLog.findUnique({ where: { id: emailLogId } });
  if (!row) return { ok: false, error: "log row not found" };
  if (row.status !== "queued") return { ok: true }; // already handled — idempotent

  try {
    const settings = await getSettings();
    let subject: string;
    let html: string;

    if (row.orderId && IS_ORDER_TEMPLATE[row.template]) {
      const ctx = await loadOrderContext(row.orderId);
      ({ subject, html } = renderOrderEmail(row.template as TemplateName, ctx, settings));
    } else if (row.template === "contact_received") {
      // legacy queued contact rows (no snapshot stored) — degrade gracefully
      subject = "[Contact] Customer message";
      html = "<p>A contact message was received (details in the admin contact inbox).</p>";
    } else {
      throw new Error(`No renderer for template "${row.template}"`);
    }

    const result = await deliver(row.to, subject, html);
    await db.emailLog.update({
      where: { id: row.id },
      data: {
        status: result.ok ? "sent" : "failed",
        subject,
        html,
        error: result.ok ? (result.via === "preview" ? PREVIEW_NOTE : null) : result.error ?? "send failed",
      },
    });
    return result.ok ? { ok: true } : { ok: false, error: result.error };
  } catch (e) {
    const message = e instanceof Error ? e.message : "email render/send failed";
    await db.emailLog
      .update({ where: { id: row.id }, data: { status: "failed", error: message } })
      .catch(() => {});
    return { ok: false, error: message };
  }
}

/** Flush every queued email for one order (call after the tx commits). */
export async function flushOrderEmails(orderId: string): Promise<void> {
  try {
    const rows = await db.emailLog.findMany({
      where: { orderId, status: "queued" },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });
    for (const r of rows) await sendQueuedEmail(r.id);
  } catch {
    // email must never break the checkout/admin flow
  }
}

/** Flush any queued emails (cron safety net — e.g. provider was down). */
export async function flushEmailLog(limit = 20): Promise<void> {
  try {
    const rows = await db.emailLog.findMany({
      where: { status: "queued" },
      select: { id: true },
      orderBy: { createdAt: "asc" },
      take: limit,
    });
    for (const r of rows) await sendQueuedEmail(r.id);
  } catch {
    // never throw from a flush
  }
}

// -----------------------------------------------------------------
// direct sends (no order context)
// -----------------------------------------------------------------

/** Contact-form notification to the store — rendered, sent, logged. */
export async function sendContactNotification(input: {
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  message: string;
}): Promise<void> {
  try {
    const settings = await getSettings();
    const to = settings.email || "orders@fch.pk";
    const { subject, html } = renderContactEmail(input);
    const result = await deliver(to, subject, html);
    await db.emailLog.create({
      data: {
        to,
        template: "contact_received",
        status: result.ok ? "sent" : "failed",
        subject,
        html,
        error: result.ok ? (result.via === "preview" ? PREVIEW_NOTE : null) : result.error ?? "send failed",
      },
    });
  } catch {
    // contact form must not fail because of email
  }
}

/** Queue an order email row inside an existing transaction (idempotent). */
export async function queueOrderEmail(
  tx: Prisma.TransactionClient,
  input: { orderId: string; to: string; template: TemplateName; dedupeKey?: string }
): Promise<void> {
  await tx.emailLog.create({
    data: {
      orderId: input.orderId,
      to: input.to,
      template: input.template,
      status: "queued",
      dedupeKey: input.dedupeKey ?? "",
    },
  });
}

/** Convenience for logging — human label used in admin UI headers. */
export function emailTransportLabel(): string {
  if (process.env.RESEND_API_KEY) return "Resend";
  if (process.env.SMTP_HOST) return "SMTP";
  return "Preview (log only)";
}
