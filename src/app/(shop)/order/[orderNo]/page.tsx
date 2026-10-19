import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Hash, Landmark, Upload } from "lucide-react";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatPKR, formatDateTime, phoneCore } from "@/lib/format";
import { BankDetails } from "@/components/store/bank-details";
import { PaymentForm } from "@/components/store/payment-form";
import { OrderStatusBadge } from "@/components/store/order-status-badge";

type Params = Promise<{ orderNo: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const metadata: Metadata = {
  title: { absolute: "Order Payment — Fashion and Collection House" },
  robots: { index: false, follow: false },
};

/**
 * Order / payment-instructions screen. Guests reach it straight after checkout
 * (?p=phone) and re-open it from Track Order. Phone acts as the lightweight
 * ownership check.
 */
export default async function OrderPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { orderNo: rawNo } = await params;
  const sp = await searchParams;
  const phone = typeof sp.p === "string" ? sp.p : "";

  const orderNo = decodeURIComponent(rawNo).toUpperCase();
  const [order, settings] = await Promise.all([
    db.order.findUnique({
      where: { orderNo },
      include: {
        items: { orderBy: { productName: "asc" } },
        payments: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    }),
    getSettings(),
  ]);

  if (!order || !phone || phoneCore(order.phone) !== phoneCore(phone)) {
    notFound();
  }

  const canUpload = order.status === "awaiting_payment" || order.status === "payment_rejected";
  const deadline = new Date(order.createdAt.getTime() + settings.paymentUploadDeadlineHours * 3600_000);
  const toNumber = (v: { toNumber: () => number } | null) => (v ? v.toNumber() : 0);

  const steps = [
    { icon: Landmark, title: "Transfer", body: <>Send <strong>{formatPKR(toNumber(order.total))}</strong> to the account on the right.</> },
    { icon: Hash, title: "Reference", body: <>Use <strong className="font-mono">{order.orderNo}</strong> as the transfer note.</> },
    { icon: Upload, title: "Upload", body: <>Screenshot below before <strong>{formatDateTime(deadline)}</strong>.</> },
  ];

  return (
    <div className="mx-auto max-w-4xl px-6 py-8 lg:py-12">
      <header className="border-b border-stone pb-6">
        <p className="label-caps text-gold">Thank you, {order.customerName.split(" ")[0]}</p>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl">Complete your payment</h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
          <span>Order <strong className="font-mono tracking-wide text-foreground">{order.orderNo}</strong></span>
          <span aria-hidden>·</span>
          <span>{formatDateTime(order.createdAt)}</span>
          <span aria-hidden>·</span>
          <OrderStatusBadge status={order.status} />
        </div>
      </header>

      {canUpload && (
        <div className="mt-8">
          <p className="label-caps text-muted-foreground">How to pay</p>
          <ol className="mt-3 grid gap-3 sm:grid-cols-3">
            {steps.map(({ icon: Icon, title, body }, i) => (
              <li key={title} className="rounded-sm border border-stone bg-card p-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[12px] font-semibold text-primary-foreground">
                    {i + 1}
                  </span>
                  <Icon className="h-4.5 w-4.5 text-gold" strokeWidth={1.6} aria-hidden />
                  <p className="text-sm font-semibold">{title}</p>
                </div>
                <p className="mt-2.5 text-[12.5px] leading-relaxed text-muted-foreground">{body}</p>
              </li>
            ))}
          </ol>
          <p className="mt-2.5 text-[11.5px] text-muted-foreground">
            Unpaid orders expire after {settings.paymentUploadDeadlineHours} hours and release the reserved stock.
          </p>
        </div>
      )}
      {order.status === "payment_rejected" && order.payments[0]?.adminNote && (
        <div className="mt-6 rounded-sm border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-foreground/85">
          <strong>Payment rejected:</strong> {order.payments[0].adminNote}
        </div>
      )}
      {order.status === "payment_submitted" && (
        <div className="mt-8 rounded-sm border border-stone bg-card px-4 py-3 text-sm text-foreground/85">
          Screenshot received — we review within {settings.paymentApprovalDeadlineHours} hours. Track progress anytime below.
        </div>
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        {/* left: summary */}
        <section>
          <h2 className="font-display text-xl">Order Summary</h2>
          <ul className="mt-4 divide-y divide-stone border-y border-stone">
            {order.items.map((i) => (
              <li key={i.id} className="flex items-start justify-between gap-4 py-3.5 text-sm">
                <div>
                  <p className="font-medium">{i.productName}</p>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">
                    {i.color} · Size {i.size} · ×{i.quantity}
                  </p>
                </div>
                <p>{formatPKR(i.unitPrice.toNumber() * i.quantity)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{formatPKR(toNumber(order.subtotal))}</dd>
            </div>
            {toNumber(order.discountAmount) > 0 && (
              <div className="flex justify-between text-gold">
                <dt>Discount</dt>
                <dd>−{formatPKR(toNumber(order.discountAmount))}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">
                {order.fulfillment === "pickup" ? "In-store pickup" : "Delivery"}
              </dt>
              <dd>{toNumber(order.shippingFee) === 0 ? "Free" : formatPKR(toNumber(order.shippingFee))}</dd>
            </div>
            <div className="flex justify-between border-t border-stone pt-2.5 text-base font-medium">
              <dt>Total</dt>
              <dd>{formatPKR(toNumber(order.total))}</dd>
            </div>
          </dl>

          <p className="mt-4 text-[12.5px] leading-relaxed text-muted-foreground">
            {order.fulfillment === "delivery" ? (
              <>Delivers to {order.address}, {order.city}.</>
            ) : (
              <>Pickup from {settings.address || "our store"} — we&apos;ll WhatsApp you when ready.</>
            )}
          </p>

          <Link href={`/track-order?order=${order.orderNo}`} className="btn-outline-luxury mt-6 inline-block">
            Track this order
          </Link>
        </section>

        {/* right: payment */}
        <section className="space-y-6">
          <BankDetails
            bankName={settings.bankName}
            accountTitle={settings.accountTitle}
            iban={settings.iban}
            total={toNumber(order.total)}
            orderNo={order.orderNo}
          />
          {canUpload && <PaymentForm orderNo={order.orderNo} phone={phone} compact />}
          {!canUpload && (
            <p className="rounded-sm border border-stone bg-card p-4 text-sm text-muted-foreground">
              Screenshot received{order.payments[0] ? ` — ${formatDateTime(order.payments[0].createdAt)}` : ""}. No further upload needed.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
