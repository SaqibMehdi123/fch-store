import { formatPKR, formatDate } from "@/lib/format";
import type { SiteSettings } from "@/lib/settings";

/**
 * Branded email templates — v2 (fluid, mobile-first, email-client safe).
 *
 * Rules this file follows (hard-won email HTML constraints):
 *  - Everything is <table role="presentation"> + inline styles; no flex/grid.
 *  - Padding & background live on <td>, never on <table> (Outlook/Gmail app).
 *  - All rows are fluid (width:100%, percentage cells) — nothing overflows phones.
 *  - One idea per line: labels are stacked kicker rows, variants on their own
 *    line, addresses line-per-item. No run-on "a · b · c" walls of text.
 *  - Real preheader text per template (clean inbox preview line).
 *
 * Every template renders from the order snapshot + live settings.
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
// palette & primitives
// -----------------------------------------------------------------

const GOLD = "#B08155";
const INK = "#161616";
const CHARCOAL = "#2B1F19";
const BODY = "#514B42";
const MUTED = "#6E6A61";
const FAINT = "#A8A297";
const LINE = "#E7E2DA";
const PAPER = "#FFFFFF";
const CARD = "#FBFAF7";
const PAGE_BG = "#ECE7DF";
const SERIF = "Georgia,'Times New Roman',serif";
const SANS = "Helvetica,Arial,sans-serif";

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

function kicker(text: string): string {
  return `<div style="font-family:${SANS};font-size:11px;letter-spacing:2.5px;text-transform:uppercase;color:${GOLD};margin-bottom:10px;">${esc(text)}</div>`;
}

function h1(text: string): string {
  return `<div style="font-family:${SERIF};font-size:23px;line-height:31px;color:${CHARCOAL};">${text}</div>`;
}

function para(text: string): string {
  return `<div style="font-family:${SANS};font-size:14px;line-height:23px;color:${BODY};margin:14px 0 0;">${text}</div>`;
}

function button(label: string, href: string): string {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:26px 0 4px;"><tr>
    <td align="center">
      <a href="${esc(href)}" style="display:inline-block;background:${INK};color:${PAPER};font-family:${SANS};font-size:12px;font-weight:bold;letter-spacing:2.5px;text-transform:uppercase;text-decoration:none;padding:14px 36px;border:1px solid ${GOLD};border-radius:2px;mso-padding-alt:14px 36px;">${esc(label)}</a>
    </td>
  </tr></table>`;
}

/** Small caps label used above detail blocks (email-safe stacked layout). */
function microLabel(text: string, color = FAINT): string {
  return `<div style="font-family:${SANS};font-size:10px;letter-spacing:1.8px;text-transform:uppercase;color:${color};">${esc(text)}</div>`;
}

// -----------------------------------------------------------------
// status timeline — fluid 5-step row, connector lines always visible
// -----------------------------------------------------------------

function timeline(status: string): string {
  const steps = ["Placed", "Payment", "Confirmed", "Shipped", "Delivered"];
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
      const size = active ? 13 : 11;
      const dot = done || active
        ? `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${GOLD};margin:0 auto;font-size:1px;line-height:1px;">&nbsp;</div>`
        : `<div style="width:${size}px;height:${size}px;border-radius:50%;border:1px solid ${LINE};background:${PAPER};margin:0 auto;font-size:1px;line-height:1px;">&nbsp;</div>`;
      const color = active ? CHARCOAL : done ? MUTED : FAINT;
      const weight = active ? "bold" : "normal";
      return `
      <td width="20%" align="center" style="vertical-align:top;padding:0;">
        ${dot}
        <div style="font-family:${SANS};font-size:9px;letter-spacing:0.5px;text-transform:uppercase;color:${color};font-weight:${weight};margin-top:8px;">${label}</div>
      </td>`;
    })
    .join(`<td style="vertical-align:top;"><div style="height:1px;background:${LINE};margin-top:5.5px;">&nbsp;</div></td>`);

  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0 4px;"><tr>${cells}</tr></table>`;
}

/** Banner for terminal / action-needed states — left accent bar + soft panel. */
function stateBanner(status: string, adminNote?: string | null): string {
  if (status === "payment_rejected") {
    return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:18px 0 0;"><tr>
      <td style="background:#FBF3EC;border-left:3px solid ${GOLD};padding:14px 18px;font-family:${SANS};font-size:13px;line-height:21px;color:#7A4A28;">
        <strong>We couldn't verify your payment.</strong>
        ${adminNote ? `<br/>Reason: ${esc(adminNote)}` : ""}
        <br/>Please re-upload a clear payment screenshot before the deadline — your pieces are still reserved for you.
      </td>
    </tr></table>`;
  }
  if (status === "cancelled" || status === "expired") {
    return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:18px 0 0;"><tr>
      <td style="background:#F4F2EE;border-left:3px solid ${FAINT};padding:14px 18px;font-family:${SANS};font-size:13px;line-height:21px;color:${MUTED};">
        ${
          status === "expired"
            ? "The payment window for this order has closed and the reserved pieces were released back to the store."
            : "This order has been cancelled and any reserved pieces were released back to the store."
        }
        ${adminNote ? `<br/>Note from the house: ${esc(adminNote)}` : ""}
      </td>
    </tr></table>`;
  }
  return "";
}

// -----------------------------------------------------------------
// order summary card
// -----------------------------------------------------------------

function orderBlock(ctx: OrderEmailContext, opts: { withTotals?: boolean } = {}): string {
  const { withTotals = true } = opts;

  const itemRows = ctx.items
    .map(
      (i) => `
      <tr>
        <td style="padding:13px 0;border-bottom:1px solid ${LINE};">
          <div style="font-family:${SANS};font-size:13.5px;font-weight:bold;line-height:20px;color:${CHARCOAL};">${esc(i.productName)}</div>
          <div style="font-family:${SANS};font-size:12px;line-height:18px;color:${MUTED};margin-top:3px;">${esc(i.color)} &middot; ${esc(i.size)} &middot; Qty ${i.quantity}</div>
        </td>
        <td align="right" valign="top" style="padding:13px 0;border-bottom:1px solid ${LINE};font-family:${SANS};font-size:13.5px;color:${CHARCOAL};white-space:nowrap;">${formatPKR(i.unitPrice * i.quantity)}</td>
      </tr>`
    )
    .join("");

  const totalRow = (label: string, value: string, opts2: { strong?: boolean; gold?: boolean } = {}) => {
    const { strong, gold } = opts2;
    return `
      <tr>
        <td style="padding:6px 0;font-family:${SANS};font-size:${strong ? "13" : "12.5"}px;${strong ? "font-weight:bold;letter-spacing:1px;text-transform:uppercase;" : ""}color:${gold ? CHARCOAL : MUTED};">${label}</td>
        <td align="right" style="padding:6px 0;font-family:${SANS};font-size:${strong ? "17" : "13"}px;${strong ? "font-weight:bold;" : ""}color:${gold ? GOLD : CHARCOAL};white-space:nowrap;">${value}</td>
      </tr>`;
  };

  const totals = withTotals
    ? `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:14px;">
        ${totalRow("Subtotal", formatPKR(ctx.subtotal))}
        ${ctx.discountAmount > 0 ? totalRow(`Discount${ctx.couponCode ? ` — ${ctx.couponCode}` : ""}`, "&minus;" + formatPKR(ctx.discountAmount)) : ""}
        ${ctx.shippingFee > 0 ? totalRow("Delivery", formatPKR(ctx.shippingFee)) : totalRow("Delivery", "Free")}
      </table>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:8px;border-top:2px solid ${CHARCOAL};">
        ${totalRow("Total", formatPKR(ctx.total), { strong: true, gold: true })}
      </table>`
    : "";

  const fulfilment =
    ctx.fulfillment === "delivery"
      ? `
      <div style="margin-top:16px;padding-top:14px;border-top:1px solid ${LINE};">
        ${microLabel("Deliver to")}
        <div style="font-family:${SANS};font-size:13px;line-height:21px;color:${CHARCOAL};margin-top:5px;">
          <strong>${esc(ctx.customerName)}</strong><br/>
          ${esc(ctx.address)}<br/>
          ${esc(ctx.city)}<br/>
          ${esc(ctx.phone)}
        </div>
      </div>`
      : `
      <div style="margin-top:16px;padding-top:14px;border-top:1px solid ${LINE};">
        ${microLabel("Collection")}
        <div style="font-family:${SANS};font-size:13px;line-height:21px;color:${CHARCOAL};margin-top:5px;">Store pickup — ${esc(ctx.city)}</div>
      </div>`;

  const courier =
    ctx.courierName
      ? `
      <div style="margin-top:14px;padding-top:14px;border-top:1px solid ${LINE};">
        ${microLabel("Shipped via")}
        <div style="font-family:${SANS};font-size:13.5px;color:${CHARCOAL};margin-top:5px;"><strong>${esc(ctx.courierName)}</strong></div>
        ${ctx.trackingNumber ? `<div style="font-family:${SANS};font-size:12.5px;color:${MUTED};margin-top:2px;">Tracking &nbsp;<strong style="color:${CHARCOAL};">${esc(ctx.trackingNumber)}</strong></div>` : ""}
      </div>`
      : "";

  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${CARD};border:1px solid ${LINE};margin:20px 0 0;">
    <tr>
      <td style="padding:18px 20px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="font-family:${SANS};font-size:11px;letter-spacing:1.8px;text-transform:uppercase;color:${GOLD};padding-bottom:3px;">Order ${esc(ctx.orderNo)}</td>
            <td align="right" style="font-family:${SANS};font-size:11px;letter-spacing:1.8px;text-transform:uppercase;color:${MUTED};padding-bottom:3px;">${formatDate(ctx.createdAt)}</td>
          </tr>
          <tr>
            <td colspan="2" style="font-family:${SANS};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${FAINT};padding-bottom:12px;border-bottom:1px solid ${LINE};">${ctx.fulfillment === "pickup" ? "Store pickup" : `Delivery — ${esc(ctx.city)}`}</td>
          </tr>
        </table>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${itemRows}</table>
        ${totals}
        ${fulfilment}
        ${courier}
      </td>
    </tr>
  </table>`;
}

// -----------------------------------------------------------------
// payment instructions — dark panel
// -----------------------------------------------------------------

function paymentInstructions(ctx: OrderEmailContext, settings: SiteSettings): string {
  const row = (label: string, value: string, gold = false) => `
      <tr>
        <td style="padding:7px 0;font-family:${SANS};font-size:10.5px;letter-spacing:1.8px;text-transform:uppercase;color:#9C968A;white-space:nowrap;padding-right:18px;">${label}</td>
        <td style="padding:7px 0;font-family:${SANS};font-size:14px;line-height:21px;color:${gold ? GOLD : PAPER};${gold ? "font-weight:bold;font-size:16px;" : ""}word-break:break-word;">${value}</td>
      </tr>`;

  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${CHARCOAL};margin:20px 0 0;">
    <tr>
      <td style="padding:22px 22px 20px;">
        ${microLabel("Bank transfer — payment instructions", GOLD)}
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:12px;">
          ${settings.bankName ? row("Bank", esc(settings.bankName)) : ""}
          ${row("Account title", esc(settings.accountTitle || "Fashion and Collection House"))}
          ${settings.iban ? row("IBAN", `<span style="letter-spacing:0.5px;">${esc(settings.iban)}</span>`) : ""}
          ${row("Amount", formatPKR(ctx.total), true)}
        </table>
        <div style="margin-top:14px;padding-top:14px;border-top:1px solid #3E362E;font-family:${SANS};font-size:12px;line-height:19px;color:#9C968A;">
          Transfer the exact amount, then upload a screenshot of the receipt from your order page. Pieces are reserved for you while payment is awaited.
        </div>
      </td>
    </tr>
  </table>`;
}

/** Label / value detail table (admin notifications). */
function detailsTable(rows: [string, string][]): string {
  const body = rows
    .filter(([, v]) => v)
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding:6px 0;font-family:${SANS};font-size:10.5px;letter-spacing:1.8px;text-transform:uppercase;color:${FAINT};white-space:nowrap;padding-right:18px;vertical-align:top;">${esc(label)}</td>
        <td style="padding:6px 0;font-family:${SANS};font-size:13px;line-height:20px;color:${CHARCOAL};word-break:break-word;">${value}</td>
      </tr>`
    )
    .join("");
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${CARD};border:1px solid ${LINE};margin:20px 0 0;">
    <tr><td style="padding:16px 20px;">
      ${microLabel("Order details")}
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:8px;">${body}</table>
    </td></tr>
  </table>`;
}

// -----------------------------------------------------------------
// shell
// -----------------------------------------------------------------

function shell(content: string, settings: SiteSettings, preheader?: string): string {
  const year = new Date().getFullYear();
  const contactBits = [settings.phone, settings.email, settings.address].filter(Boolean).map(esc);
  const contactLines = (contactBits.length ? contactBits : ["Fashion and Collection House — Pakistan"])
    .map((bit) => `<div style="font-family:${SANS};font-size:11.5px;line-height:20px;color:${MUTED};">${bit}</div>`)
    .join("");
  const preview = preheader ? `${esc(preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;` : "FCH order update";

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${PAGE_BG};">
<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:${PAGE_BG};">${preview}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${PAGE_BG}">
  <tr><td align="center" style="padding:28px 12px;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:${PAPER};">
      <!-- header -->
      <tr><td style="background:${INK};padding:30px 20px 26px;text-align:center;">
        <div style="font-family:${SERIF};font-size:30px;letter-spacing:12px;color:${PAPER};text-indent:12px;">FCH</div>
        <div style="width:44px;height:1px;background:${GOLD};margin:12px auto;">&nbsp;</div>
        <div style="font-family:${SANS};font-size:9px;letter-spacing:3px;text-transform:uppercase;color:${GOLD};">Fashion &amp; Collection House</div>
      </td></tr>
      <!-- body -->
      <tr><td style="padding:32px 24px 30px;font-family:${SANS};font-size:14px;line-height:23px;color:${BODY};">
        ${content}
      </td></tr>
      <!-- footer -->
      <tr><td style="background:${CARD};border-top:1px solid ${LINE};padding:22px 24px;text-align:center;">
        ${contactLines}
        <div style="width:36px;height:1px;background:${LINE};margin:14px auto;">&nbsp;</div>
        <div style="font-family:${SANS};font-size:9px;letter-spacing:2.5px;text-transform:uppercase;color:${FAINT};">Fashion &amp; Collection House</div>
        <div style="font-family:${SANS};font-size:10.5px;line-height:16px;color:${FAINT};margin-top:6px;">&copy; ${year} &middot; You are receiving this email because of activity on your FCH order.</div>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

// -----------------------------------------------------------------
// per-template renderers
// -----------------------------------------------------------------

type RenderInput = { ctx: OrderEmailContext; settings: SiteSettings };

const RENDERERS: Record<TemplateName, (i: RenderInput) => { subject: string; preheader: string; content: string }> = {
  order_placed: ({ ctx, settings }) => ({
    subject: `Order ${ctx.orderNo} placed — payment instructions inside`,
    preheader: `Transfer ${formatPKR(ctx.total)} and upload your receipt to confirm your order.`,
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
    preheader: `Your receipt is with us — verification within ${settings.paymentApprovalDeadlineHours} hours.`,
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
    preheader: `Payment verified — your pieces move to the atelier for packing.`,
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
    preheader: `Quality check and packing in progress — we will email you when it ships.`,
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
    preheader: `Re-upload a clear receipt — your pieces are still reserved.`,
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
    preheader: ctx.trackingNumber ? `On its way via ${ctx.courierName} — tracking ${ctx.trackingNumber}.` : `Your order has shipped.`,
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
    preheader: `Delivered — we hope the pieces feel every bit as luxurious as they look.`,
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
    preheader: `Your order has been cancelled — the collection is waiting when you return.`,
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
    preheader: `The payment window closed and the reserved pieces were released.`,
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
    preheader: `${ctx.customerName} placed a ${ctx.fulfillment === "pickup" ? "pickup" : "delivery"} order.`,
    content: `
      ${kicker("Store notification")}
      ${h1(`New order ${esc(ctx.orderNo)} — ${formatPKR(ctx.total)}`)}
      ${detailsTable([
        ["Customer", `<strong>${esc(ctx.customerName)}</strong>`],
        ["Email", esc(ctx.customerEmail)],
        ["Phone", esc(ctx.phone)],
        ["Fulfilment", ctx.fulfillment === "pickup" ? `Store pickup — ${esc(ctx.city)}` : `Delivery — ${esc(ctx.address)}, ${esc(ctx.city)}`],
        ["Coupon", ctx.couponCode ? esc(ctx.couponCode) : ""],
        ["Customer note", ctx.customerNote ? esc(ctx.customerNote) : ""],
      ])}
      ${orderBlock(ctx)}
      ${button("Open the order", `${appUrl()}/admin/orders/${ctx.orderNo}`)}
    `,
  }),

  admin_payment_uploaded: ({ ctx }) => ({
    subject: `[Admin] Payment screenshot uploaded for ${ctx.orderNo}`,
    preheader: `${ctx.payment?.senderName || "The customer"} submitted a receipt for verification.`,
    content: `
      ${kicker("Verification queue")}
      ${h1(`Payment uploaded for ${esc(ctx.orderNo)}`)}
      ${detailsTable([
        ["Sender", esc(ctx.payment?.senderName || "The customer")],
        ["Amount", formatPKR(ctx.payment?.amount ?? ctx.total)],
        ["Reference", ctx.payment?.transactionRef ? esc(ctx.payment.transactionRef) : ""],
      ])}
      ${para(`A transfer receipt has been submitted for verification. The order is now in the payment verification queue.`)}
      ${orderBlock(ctx)}
      ${button("Review the payment", `${appUrl()}/admin/verification`)}
    `,
  }),
};

/** Render a template into subject + full HTML document. Throws on unknown template. */
export function renderOrderEmail(template: TemplateName, ctx: OrderEmailContext, settings: SiteSettings): { subject: string; html: string } {
  const renderer = RENDERERS[template];
  if (!renderer) throw new Error(`Unknown email template: ${template}`);
  const { subject, preheader, content } = renderer({ ctx, settings });
  return { subject, html: shell(content, settings, preheader) };
}

/** Branded email sent to the store when a customer submits the contact form. */
export function renderContactEmail(input: { name: string; email: string; phone?: string | null; subject?: string | null; message: string }): { subject: string; html: string } {
  const settings: SiteSettings = { ...({} as SiteSettings) };
  const content = `
    ${kicker("Contact form")}
    ${h1(`New message from ${esc(input.name)}`)}
    ${detailsTable([
      ["Name", `<strong>${esc(input.name)}</strong>`],
      ["Email", esc(input.email)],
      ["Phone", input.phone ? esc(input.phone) : ""],
      ["Subject", input.subject ? esc(input.subject) : ""],
    ])}
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${CARD};border:1px solid ${LINE};margin:20px 0 0;">
      <tr><td style="padding:16px 20px;">
        ${microLabel("Message")}
        <div style="font-family:${SANS};font-size:13px;line-height:21px;color:${BODY};margin-top:8px;white-space:pre-wrap;">${esc(input.message)}</div>
      </td></tr>
    </table>
    ${button("Reply by email", `mailto:${esc(input.email)}`)}
  `;
  const { subject } = { subject: `[Contact] ${input.subject || `Message from ${input.name}`}` };
  return { subject, html: shell(content, settings, `New message from ${input.name} — website contact form.`) };
}
