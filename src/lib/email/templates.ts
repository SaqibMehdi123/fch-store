import { formatPKR, formatDate } from "@/lib/format";
import type { SiteSettings } from "@/lib/settings";

/**
 * Phase 5 — branded email templates.
 *
 * Table-based, inline-styled HTML (email-client safe): dark charcoal header
 * with the FCH wordmark, gold accents, a status timeline, the order summary
 * block and a plain footer. Every template renders from the order snapshot
 * + live settings so emails never trust client input.
 */

export type TemplateName =
  | "order_placed"
  | "payment_submitted"
  | "order_confirmed"
  | "order_processing"
  | "payment_rejected"
  | "order_shipped"
  | "order_delivered"
  | "order_cancelled"
  | "order_expired"
  | "admin_new_order"
  | "admin_payment_uploaded";

/** Templates that require an order context (all current ones except contact). */
export const IS_ORDER_TEMPLATE: Record<string, boolean> = {
  order_placed: true,
  payment_submitted: true,
  order_confirmed: true,
  order_processing: true,
  payment_rejected: true,
  order_shipped: true,
  order_delivered: true,
  order_cancelled: true,
  order_expired: true,
  admin_new_order: true,
  admin_payment_uploaded: true,
};

export type OrderEmailContext = {
  orderNo: string;
  status: string;
  customerName: string;
  customerEmail: string;
  phone: string;
  address: string;
  city: string;
  fulfillment: string;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  total: number;
  couponCode: string | null;
  courierName: string | null;
  trackingNumber: string | null;
  customerNote: string | null;
  createdAt: string;
  items: { productName: string; color: string; size: string; unitPrice: number; quantity: number }[];
  payment: { amount: number; transactionRef: string | null; senderName: string | null; adminNote: string | null } | null;
};

// -----------------------------------------------------------------
// helpers
// -----------------------------------------------------------------

const GOLD = "#B08D57";
const CHARCOAL = "#1A1A1A";
const IVORY = "#F8F6F2";
const STONE = "#E7E2DA";
const MUTED = "#6E6A61";

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || "there";
}

function appUrl(): string {
  return (process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function button(label: string, href: string): string {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px auto 6px;"><tr><td align="center">
    <a href="${esc(href)}" style="display:inline-block;background:${CHARCOAL};color:${IVORY};font-family:Georgia,'Times New Roman',serif;font-size:12px;letter-spacing:2.5px;text-transform:uppercase;text-decoration:none;padding:13px 34px;border:1px solid ${GOLD};border-radius:2px;">${esc(label)}</a>
  </td></tr></table>`;
}

/** Status timeline — Placed → Payment → Confirmed → Shipped → Delivered. */
function timeline(status: string): string {
  const steps = ["Order placed", "Payment", "Confirmed", "Shipped", "Delivered"];
  const activeIndex: Record<string, number> = {
    awaiting_payment: 0,
    payment_submitted: 1,
    confirmed: 2,
    processing: 2,
    shipped: 3,
    delivered: 4,
    payment_rejected: 1,
  };
  const current = activeIndex[status] ?? 0;

  const cells = steps
    .map((label, i) => {
      const done = i < current;
      const active = i === current;
      const dot =
        done || active
          ? `<div style="width:13px;height:13px;border-radius:50%;background:${GOLD};margin:0 auto;"></div>`
          : `<div style="width:13px;height:13px;border-radius:50%;border:1px solid ${STONE};background:${IVORY};margin:0 auto;"></div>`;
      const color = active ? CHARCOAL : done ? MUTED : "#A8A297";
      const weight = active ? "bold" : "normal";
      return `
      <td align="center" style="padding:0 4px;width:100px;">
        ${dot}
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:1px;text-transform:uppercase;color:${color};font-weight:${weight};margin-top:7px;">${label}</div>
      </td>`;
    })
    .join(`<td style="width:18px;border-top:1px solid ${STONE};height:7px;"></td>`);

  return `
  <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:20px auto 8px;"><tr>${cells}</tr></table>`;
}

/** Banner for terminal / action-needed states. */
function stateBanner(status: string, adminNote?: string | null): string {
  if (status === "payment_rejected") {
    return `
    <div style="background:#FBF3EE;border:1px solid #E3C6B0;border-radius:3px;padding:14px 18px;margin:16px 0 6px;font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:20px;color:#7A4A28;">
      <strong>We couldn't verify your payment${adminNote ? "" : "."}</strong>${
        adminNote ? `<br/>Reason: ${esc(adminNote)}` : ""
      }<br/>Please re-upload a clear payment screenshot before the deadline — your pieces are still reserved for you.
    </div>`;
  }
  if (status === "cancelled" || status === "expired") {
    return `
    <div style="background:#F4F2EE;border:1px solid ${STONE};border-radius:3px;padding:14px 18px;margin:16px 0 6px;font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:20px;color:${MUTED};">
      ${
        status === "expired"
          ? "The payment window for this order has closed and the reserved pieces were released back to the store."
          : "This order has been cancelled and any reserved pieces were released back to the store."
      }
      ${adminNote ? `<br/>Note from the house: ${esc(adminNote)}` : ""}
    </div>`;
  }
  return "";
}

/** Order summary card. */
function orderBlock(ctx: OrderEmailContext, opts: { withTotals?: boolean } = {}): string {
  const { withTotals = true } = opts;
  const rows = ctx.items
    .map(
      (i) => `
      <tr>
        <td style="padding:9px 0;border-bottom:1px solid ${STONE};font-family:Helvetica,Arial,sans-serif;font-size:13px;color:${CHARCOAL};">
          <strong>${esc(i.productName)}</strong>
          <span style="color:${MUTED};"> — ${esc(i.color)}, ${esc(i.size)} &nbsp;×&nbsp; ${i.quantity}</span>
        </td>
        <td align="right" style="padding:9px 0;border-bottom:1px solid ${STONE};font-family:Helvetica,Arial,sans-serif;font-size:13px;color:${CHARCOAL};white-space:nowrap;">${formatPKR(i.unitPrice * i.quantity)}</td>
      </tr>`
    )
    .join("");

  const totalRow = (label: string, value: string, bold = false, gold = false) => `
      <tr>
        <td align="right" style="padding:5px 0;font-family:Helvetica,Arial,sans-serif;font-size:${bold ? "14" : "12.5"}px;${bold ? "font-weight:bold;" : ""}color:${gold ? GOLD : MUTED};letter-spacing:${gold ? "0.5" : "0"}px;">${label}</td>
        <td align="right" style="padding:5px 0;width:110px;font-family:Helvetica,Arial,sans-serif;font-size:${bold ? "16" : "13"}px;${bold ? "font-weight:bold;" : ""}color:${gold ? GOLD : CHARCOAL};white-space:nowrap;">${value}</td>
      </tr>`;

  return `
  <div style="background:#FBFAF7;border:1px solid ${STONE};border-radius:3px;padding:20px 22px;margin:18px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${GOLD};padding-bottom:10px;">Order ${esc(ctx.orderNo)} · ${formatDate(ctx.createdAt)}</td>
        <td align="right" style="font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${MUTED};padding-bottom:10px;">${ctx.fulfillment === "pickup" ? "Store pickup" : "Delivery — " + esc(ctx.city)}</td>
      </tr>
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
    ${
      withTotals
        ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;">
            ${totalRow("Subtotal", formatPKR(ctx.subtotal))}
            ${ctx.discountAmount > 0 ? totalRow(`Discount${ctx.couponCode ? ` (${ctx.couponCode})` : ""}`, "−" + formatPKR(ctx.discountAmount)) : ""}
            ${ctx.shippingFee > 0 ? totalRow("Delivery", formatPKR(ctx.shippingFee)) : totalRow("Delivery", "Free")}
            ${totalRow("Total", formatPKR(ctx.total), true, true)}
          </table>`
        : ""
    }
    ${
      ctx.fulfillment === "delivery"
        ? `<div style="margin-top:12px;padding-top:12px;border-top:1px solid ${STONE};font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:19px;color:${MUTED};">Deliver to: <span style="color:${CHARCOAL};">${esc(ctx.customerName)}</span> · ${esc(ctx.address)}, ${esc(ctx.city)} · ${esc(ctx.phone)}</div>`
        : ""
    }
    ${
      ctx.courierName
        ? `<div style="margin-top:10px;font-family:Helvetica,Arial,sans-serif;font-size:12.5px;color:${CHARCOAL};">Courier: <strong>${esc(ctx.courierName)}</strong>${ctx.trackingNumber ? ` · Tracking <strong>${esc(ctx.trackingNumber)}</strong>` : ""}</div>`
        : ""
    }
  </div>`;
}

function paymentInstructions(ctx: OrderEmailContext, settings: SiteSettings): string {
  return `
  <div style="background:${CHARCOAL};border-radius:3px;padding:22px 24px;margin:18px 0;color:${IVORY};">
    <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:2.5px;text-transform:uppercase;color:${GOLD};margin-bottom:12px;">Bank transfer — payment instructions</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:22px;">
      ${settings.bankName ? `<tr><td style="color:#9C968A;padding-right:12px;white-space:nowrap;">Bank</td><td style="color:${IVORY};">${esc(settings.bankName)}</td></tr>` : ""}
      <tr><td style="color:#9C968A;padding-right:12px;white-space:nowrap;">Account title</td><td style="color:${IVORY};">${esc(settings.accountTitle || "Fashion and Collection House")}</td></tr>
      ${settings.iban ? `<tr><td style="color:#9C968A;padding-right:12px;white-space:nowrap;">IBAN</td><td style="color:${IVORY};letter-spacing:0.5px;">${esc(settings.iban)}</td></tr>` : ""}
      <tr><td style="color:#9C968A;padding-right:12px;white-space:nowrap;">Amount</td><td style="color:${GOLD};font-weight:bold;font-size:15px;">${formatPKR(ctx.total)}</td></tr>
    </table>
    <div style="margin-top:12px;padding-top:12px;border-top:1px solid #333;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:19px;color:#9C968A;">
      Transfer the exact amount, then upload a screenshot of the receipt from your order page. Pieces are reserved for you while payment is awaited.
    </div>
  </div>`;
}

// -----------------------------------------------------------------
// shell
// -----------------------------------------------------------------

function shell(content: string, settings: SiteSettings): string {
  const year = new Date().getFullYear();
  const contactLine = [settings.phone, settings.email, settings.address].filter(Boolean).map(esc).join(" &nbsp;·&nbsp; ");
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${STONE};">
<div style="display:none;font-size:1px;color:${STONE};">FCH order update</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${STONE};padding:26px 10px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FFFFFF;border-radius:4px;overflow:hidden;">
      <!-- header -->
      <tr><td style="background:#161616;padding:30px 20px 26px;text-align:center;">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:30px;letter-spacing:12px;color:${IVORY};text-indent:12px;">FCH</div>
        <div style="width:44px;height:1px;background:${GOLD};margin:12px auto;"></div>
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:${GOLD};">Fashion &amp; Collection House</div>
      </td></tr>
      <!-- body -->
      <tr><td style="padding:34px 40px 30px;">
        ${content}
      </td></tr>
      <!-- footer -->
      <tr><td style="background:#FBFAF7;border-top:1px solid ${STONE};padding:20px 40px;text-align:center;">
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;line-height:18px;color:${MUTED};">${contactLine || "Fashion and Collection House — Pakistan"}</div>
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:10.5px;line-height:17px;color:#A8A297;margin-top:8px;">© ${year} Fashion and Collection House. You are receiving this email because of activity on your FCH order.</div>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

function kicker(text: string): string {
  return `<div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:2.5px;text-transform:uppercase;color:${GOLD};margin-bottom:10px;">${esc(text)}</div>`;
}

function h1(text: string): string {
  return `<div style="font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:32px;color:${CHARCOAL};">${text}</div>`;
}

function para(text: string): string {
  return `<div style="font-family:Helvetica,Arial,sans-serif;font-size:13.5px;line-height:22px;color:#4A463E;margin:12px 0;">${text}</div>`;
}

// -----------------------------------------------------------------
// per-template renderers
// -----------------------------------------------------------------

type RenderInput = { ctx: OrderEmailContext; settings: SiteSettings };

const RENDERERS: Record<TemplateName, (i: RenderInput) => { subject: string; content: string }> = {
  order_placed: ({ ctx, settings }) => ({
    subject: `Order ${ctx.orderNo} placed — payment instructions inside`,
    content: `
      ${kicker("Thank you for your order")}
      ${h1(`Dear ${esc(firstName(ctx.customerName))}, your pieces are reserved.`)}
      ${para(`Your order <strong>${esc(ctx.orderNo)}</strong> for <strong style="color:${GOLD};">${formatPKR(ctx.total)}</strong> has been placed successfully. Complete the bank transfer below and upload your receipt — we will confirm your order as soon as it is verified.`)}
      ${timeline(ctx.status)}
      ${paymentInstructions(ctx, settings)}
      ${orderBlock(ctx)}
      ${button("Upload payment screenshot", `${appUrl()}/order/${ctx.orderNo}`)}
      ${para(`This link also tracks your order at any time. Pieces are held for <strong>${settings.paymentUploadDeadlineHours} hours</strong> pending payment.`)}
    `,
  }),

  payment_submitted: ({ ctx, settings }) => ({
    subject: `Payment received for ${ctx.orderNo} — under review`,
    content: `
      ${kicker("Payment received")}
      ${h1(`Your receipt is with the house, ${esc(firstName(ctx.customerName))}.`)}
      ${para(`We have received the payment screenshot for <strong>${esc(ctx.orderNo)}</strong>. Our team verifies transfers within <strong>${settings.paymentApprovalDeadlineHours} hours</strong> — you will get an email the moment your order is confirmed.`)}
      ${timeline(ctx.status)}
      ${orderBlock(ctx)}
      ${button("View order status", `${appUrl()}/order/${ctx.orderNo}`)}
    `,
  }),

  order_confirmed: ({ ctx }) => ({
    subject: `Payment confirmed — ${ctx.orderNo} is being prepared`,
    content: `
      ${kicker("Payment confirmed")}
      ${h1(`Confirmed — welcome to the house, ${esc(firstName(ctx.customerName))}.`)}
      ${para(`Your payment for <strong>${esc(ctx.orderNo)}</strong> has been verified. Your pieces now move to our atelier for a final quality check before they are carefully packed for ${ctx.fulfillment === "pickup" ? "store pickup" : "dispatch to " + esc(ctx.city)}.`)}
      ${timeline(ctx.status)}
      ${orderBlock(ctx)}
      ${button("Track your order", `${appUrl()}/order/${ctx.orderNo}`)}
    `,
  }),

  order_processing: ({ ctx }) => ({
    subject: `${ctx.orderNo} is being prepared`,
    content: `
      ${kicker("In the atelier")}
      ${h1(`Your order is being prepared, ${esc(firstName(ctx.customerName))}.`)}
      ${para(`Good news — <strong>${esc(ctx.orderNo)}</strong> is now being quality-checked and packed. We will email you the moment it ships.`)}
      ${timeline(ctx.status)}
      ${orderBlock(ctx)}
    `,
  }),

  payment_rejected: ({ ctx, settings }) => ({
    subject: `Action needed — payment for ${ctx.orderNo} could not be verified`,
    content: `
      ${kicker("Action needed")}
      ${h1(`We couldn't verify your payment for ${esc(ctx.orderNo)}.`)}
      ${stateBanner("payment_rejected", ctx.payment?.adminNote)}
      ${para(`Nothing is lost — your pieces are still reserved. Please re-upload a clear screenshot of the transfer receipt${settings.iban ? ` to <strong>${esc(settings.iban)}</strong>` : ""} for <strong style="color:${GOLD};">${formatPKR(ctx.total)}</strong> before the deadline, and we will review it again.`)}
      ${orderBlock(ctx)}
      ${button("Re-upload payment screenshot", `${appUrl()}/order/${ctx.orderNo}`)}
      ${para(`Pieces are held for <strong>${settings.paymentUploadDeadlineHours} hours</strong> from this notice.`)}
    `,
  }),

  order_shipped: ({ ctx }) => ({
    subject: ctx.trackingNumber ? `${ctx.orderNo} shipped via ${ctx.courierName} — tracking ${ctx.trackingNumber}` : `${ctx.orderNo} has shipped`,
    content: `
      ${kicker("On its way")}
      ${h1(`Your pieces are on the way, ${esc(firstName(ctx.customerName))}.`)}
      ${para(
        `<strong>${esc(ctx.orderNo)}</strong> has been handed to <strong>${esc(ctx.courierName ?? "our courier partner")}</strong>${
          ctx.trackingNumber ? ` — tracking number <strong style="color:${GOLD};">${esc(ctx.trackingNumber)}</strong>` : ""
        }. Expect delivery within 2–4 working days.`
      )}
      ${timeline(ctx.status)}
      ${orderBlock(ctx)}
      ${ctx.trackingNumber ? button("Track your order", `${appUrl()}/order/${ctx.orderNo}`) : ""}
    `,
  }),

  order_delivered: ({ ctx }) => ({
    subject: `Delivered — thank you for shopping with FCH`,
    content: `
      ${kicker("Delivered")}
      ${h1(`It has arrived, ${esc(firstName(ctx.customerName))}.`)}
      ${para(`<strong>${esc(ctx.orderNo)}</strong> has been delivered${ctx.fulfillment === "pickup" ? " — thank you for picking it up in person" : ""}. We hope the pieces feel every bit as luxurious as they look. If anything is not perfect, reply to this email or reach us on WhatsApp within 7 days.`)}
      ${timeline(ctx.status)}
      ${orderBlock(ctx, { withTotals: false })}
      ${button("Continue shopping", `${appUrl()}/women`)}
    `,
  }),

  order_cancelled: ({ ctx }) => ({
    subject: `${ctx.orderNo} has been cancelled`,
    content: `
      ${kicker("Order cancelled")}
      ${h1("Your order has been cancelled.")}
      ${stateBanner("cancelled", ctx.payment?.adminNote)}
      ${para("If this was a mistake or you would like to reorder, the collection is waiting for you at the store.")}
      ${orderBlock(ctx, { withTotals: false })}
      ${button("Back to the store", `${appUrl()}/women`)}
    `,
  }),

  order_expired: ({ ctx }) => ({
    subject: `${ctx.orderNo} expired — payment window closed`,
    content: `
      ${kicker("Order expired")}
      ${h1(`The payment window for ${esc(ctx.orderNo)} has closed.`)}
      ${stateBanner("expired")}
      ${para("Because no payment screenshot was uploaded in time, the reserved pieces were released back to the store. If you still love them, place a fresh order — and reply to this email if something went wrong on your end; we are happy to help.")}
      ${orderBlock(ctx, { withTotals: false })}
      ${button("Browse the collection", `${appUrl()}/women`)}
    `,
  }),

  admin_new_order: ({ ctx }) => ({
    subject: `[Admin] New order ${ctx.orderNo} — ${formatPKR(ctx.total)}`,
    content: `
      ${kicker("Store notification")}
      ${h1(`New order ${esc(ctx.orderNo)} — ${formatPKR(ctx.total)}`)}
      ${para(`<strong>${esc(ctx.customerName)}</strong> (${esc(ctx.customerEmail)}, ${esc(ctx.phone)}) placed a ${ctx.fulfillment === "pickup" ? "store-pickup" : "delivery"} order${ctx.couponCode ? ` using coupon <strong>${esc(ctx.couponCode)}</strong>` : ""}. ${ctx.fulfillment === "delivery" ? `Deliver to ${esc(ctx.address)}, ${esc(ctx.city)}.` : "Store pickup."}${ctx.customerNote ? `<br/>Customer note: ${esc(ctx.customerNote)}` : ""}`)}
      ${orderBlock(ctx)}
      ${button("Open the order", `${appUrl()}/admin/orders/${ctx.orderNo}`)}
    `,
  }),

  admin_payment_uploaded: ({ ctx }) => ({
    subject: `[Admin] Payment screenshot uploaded for ${ctx.orderNo}`,
    content: `
      ${kicker("Verification queue")}
      ${h1(`Payment uploaded for ${esc(ctx.orderNo)}`)}
      ${para(`${esc(ctx.payment?.senderName || "The customer")} submitted a transfer receipt${ctx.payment?.transactionRef ? ` (ref ${esc(ctx.payment.transactionRef)})` : ""} of <strong style="color:${GOLD};">${formatPKR(ctx.payment?.amount ?? ctx.total)}</strong> for verification. The order is now in the payment verification queue.`)}
      ${orderBlock(ctx)}
      ${button("Review the payment", `${appUrl()}/admin/verification`)}
    `,
  }),
};

/** Render a template into subject + full HTML document. Throws on unknown template. */
export function renderOrderEmail(template: TemplateName, ctx: OrderEmailContext, settings: SiteSettings): { subject: string; html: string } {
  const renderer = RENDERERS[template];
  if (!renderer) throw new Error(`Unknown email template: ${template}`);
  const { subject, content } = renderer({ ctx, settings });
  return { subject, html: shell(content, settings) };
}

/** Branded email sent to the store when a customer submits the contact form. */
export function renderContactEmail(input: { name: string; email: string; phone?: string | null; subject?: string | null; message: string }): { subject: string; html: string } {
  const content = `
    ${kicker("Contact form")}
    ${h1(`New message from ${esc(input.name)}`)}
    ${para(`<strong>${esc(input.email)}</strong>${input.phone ? ` · ${esc(input.phone)}` : ""}${input.subject ? `<br/>Subject: ${esc(input.subject)}` : ""}`)}
    <div style="background:#FBFAF7;border:1px solid ${STONE};border-radius:3px;padding:18px 20px;margin:16px 0;font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:21px;color:#4A463E;white-space:pre-wrap;">${esc(input.message)}</div>
    ${button("Open the inbox", `mailto:${esc(input.email)}`)}
  `;
  const settings: SiteSettings = { ...({} as SiteSettings) };
  return { subject: `[Contact] ${input.subject || `Message from ${input.name}`}`, html: shell(content, settings) };
}
