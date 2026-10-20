/**
 * Render every email template to HTML files for visual inspection.
 * Run: bun scripts/render-emails.ts [outdir]
 * No DB needed — mock context + mock settings.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { renderOrderEmail, renderContactEmail, type TemplateName, type OrderEmailContext } from "../src/lib/email/templates";

const OUT = resolve(process.argv[2] ?? "scripts/email-previews");
mkdirSync(OUT, { recursive: true });

const settings = {
  bankName: "Meezan Bank",
  accountTitle: "FASHION AND COLLECTION HOUSE",
  iban: "PK36MEZN0001234567890123",
  phone: "+92 300 1234567",
  email: "orders@fch.pk",
  address: "Boulevard Mall, Gulberg III, Lahore",
  paymentUploadDeadlineHours: 24,
  paymentApprovalDeadlineHours: 12,
} as any;

const baseCtx: OrderEmailContext = {
  orderNo: "FCH-8F3B4BB2",
  status: "awaiting_payment",
  customerName: "Ayesha Khan",
  customerEmail: "ayesha.khan@example.com",
  phone: "+92 321 9876543",
  address: "House 12, Street 4, DHA Phase 5",
  city: "Lahore",
  fulfillment: "delivery",
  subtotal: 24500,
  discountAmount: 2500,
  shippingFee: 250,
  total: 22250,
  couponCode: "WELCOME10",
  courierName: null,
  trackingNumber: null,
  customerNote: "Please gift wrap if possible.",
  createdAt: new Date().toISOString(),
  items: [
    { productName: "Embroidered Velvet Bridal Shawl — Winter Couture Edition", color: "Chocolate", size: "Free Size", unitPrice: 18500, quantity: 1 },
    { productName: "Silk Blend Kurta", color: "Ivory", size: "M", unitPrice: 6000, quantity: 1 },
  ],
  payment: null,
};

const variants: Partial<Record<TemplateName, Partial<OrderEmailContext>>> = {
  order_placed: {},
  payment_submitted: { status: "payment_submitted", payment: { amount: 22250, transactionRef: "FT2600198KQA", senderName: "Ayesha Khan", adminNote: null } },
  order_confirmed: { status: "confirmed" },
  order_processing: { status: "processing" },
  payment_rejected: { status: "payment_rejected", payment: { amount: 22250, transactionRef: "FT2600198KQA", senderName: "Ayesha Khan", adminNote: "Screenshot was blurry — amount not readable." } },
  order_shipped: { status: "shipped", courierName: "TCS Overnight", trackingNumber: "TCS-771234895" },
  order_delivered: { status: "delivered", courierName: "TCS Overnight", trackingNumber: "TCS-771234895" },
  order_cancelled: { status: "cancelled", payment: { amount: 22250, transactionRef: null, senderName: null, adminNote: "Duplicate order." } },
  order_expired: { status: "expired" },
  admin_new_order: {},
  admin_payment_uploaded: { status: "payment_submitted", payment: { amount: 22250, transactionRef: "FT2600198KQA", senderName: "Ayesha Khan", adminNote: null } },
};

for (const [tpl, patch] of Object.entries(variants)) {
  const ctx = { ...baseCtx, ...patch } as OrderEmailContext;
  const { subject, html } = renderOrderEmail(tpl as TemplateName, ctx, settings);
  writeFileSync(join(OUT, `${tpl}.html`), html);
  console.log(`${tpl}.html  ←  ${subject}`);
}

const contact = renderContactEmail({
  name: "Ayesha Khan",
  email: "ayesha.khan@example.com",
  phone: "+92 321 9876543",
  subject: "Sizing question for the velvet shawl",
  message: "Salam! I wanted to ask whether the Embroidered Velvet Bridal Shawl runs true to size for the ready-to-wear pieces, or whether I should size up. Also, do you ship to Multan?\n\nShukriya!",
});
writeFileSync(join(OUT, "contact_received.html"), contact.html);
console.log("contact_received.html  ← ", contact.subject);
console.log(`\nWritten to ${OUT}`);
