"use client";

import { useState, useTransition } from "react";
import { PackageSearch } from "lucide-react";
import { lookupOrder, type TrackedOrder } from "@/app/actions/checkout";
import { formatPKR, formatDateTime, ORDER_STATUS_LABELS } from "@/lib/format";
import { cn } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/store/order-status-badge";
import { PaymentForm } from "@/components/store/payment-form";
import { BankDetails } from "@/components/store/bank-details";

const TIMELINE = ["awaiting_payment", "payment_submitted", "confirmed", "processing", "shipped", "delivered"] as const;

/** Terminal / side statuses — displayed as an alert instead of a timeline step. */
const SIDE_STATUS_MESSAGE: Record<string, string> = {
  payment_rejected: "Your payment screenshot was rejected — please re-upload below.",
  cancelled: "This order was cancelled. Contact us on WhatsApp if this looks wrong.",
  expired: "This order expired because the payment screenshot wasn't uploaded in time. The reserved stock was released — place a new order.",
};

export function TrackOrderView({
  prefillOrderNo,
  settings,
}: {
  prefillOrderNo: string;
  settings: { bankName: string; accountTitle: string; iban: string };
}) {
  const [orderNo, setOrderNo] = useState(prefillOrderNo);
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const lookup = (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await lookupOrder(orderNo, phone);
      if (res.found) setResult(res);
      else {
        setResult(null);
        setError(res.message);
      }
    });
  };

  // which timeline step are we on? (side statuses render separately)
  const stepIndex = result && result.found ? TIMELINE.indexOf(result.status as (typeof TIMELINE)[number]) : -1;

  return (
    <div className="mx-auto max-w-4xl px-6 py-8 lg:py-12">
      <header className="border-b border-stone pb-6">
        <p className="label-caps text-gold">Customer care</p>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl">Track Your Order</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter the order number from your confirmation (e.g. FCH-1001) and the mobile number you ordered with.
        </p>
      </header>

      <form onSubmit={lookup} className="mt-6 grid gap-3 sm:grid-cols-[1fr_1fr_auto]" noValidate>
        <div>
          <label htmlFor="tr-order" className="sr-only">Order number</label>
          <input
            id="tr-order"
            value={orderNo}
            onChange={(e) => setOrderNo(e.target.value.toUpperCase())}
            placeholder="FCH-1001"
            className="h-11 w-full rounded-sm border border-stone bg-background px-3 font-mono text-sm uppercase tracking-wide placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-gold"
          />
        </div>
        <div>
          <label htmlFor="tr-phone" className="sr-only">Phone number</label>
          <input
            id="tr-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="03XX-XXXXXXX"
            className="h-11 w-full rounded-sm border border-stone bg-background px-3 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-gold"
          />
        </div>
        <button type="submit" disabled={pending} className="btn-luxury h-11 px-6 disabled:opacity-60">
          <PackageSearch className="mr-1.5 inline h-4 w-4" /> {pending ? "Looking…" : "Track"}
        </button>
      </form>
      {error && <p className="mt-3 rounded-sm bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      {result && result.found && (
        <div className="mt-8 space-y-8">
          {/* status */}
          <section className="rounded-sm border border-stone bg-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl">
                  Order <span className="font-mono tracking-wide">{result.orderNo}</span>
                </h2>
                <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                  Placed {formatDateTime(result.createdAt)} · {result.fulfillment === "pickup" ? "In-store pickup" : `Delivery to ${result.city}`}
                </p>
              </div>
              <OrderStatusBadge status={result.status} />
            </div>

            {SIDE_STATUS_MESSAGE[result.status] ? (
              <p className="mt-4 rounded-sm border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-foreground/85">
                {SIDE_STATUS_MESSAGE[result.status]}
              </p>
            ) : (
              <ol className="mt-6 grid gap-4 sm:grid-cols-6">
                {TIMELINE.map((s, i) => (
                  <li key={s} className="relative flex items-start gap-3 sm:flex-col sm:gap-2">
                    <span
                      className={cn(
                        "mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold",
                        i < stepIndex && "border-gold bg-gold text-white",
                        i === stepIndex && "border-gold bg-gold/15 text-gold",
                        i > stepIndex && "border-stone bg-background text-muted-foreground/60"
                      )}
                      aria-hidden
                    >
                      {i < stepIndex ? "✓" : i + 1}
                    </span>
                    <span
                      className={cn(
                        "text-[11.5px] leading-snug sm:text-[11px]",
                        i <= stepIndex ? "font-medium text-foreground" : "text-muted-foreground/70"
                      )}
                    >
                      {ORDER_STATUS_LABELS[s]}
                    </span>
                  </li>
                ))}
              </ol>
            )}

            {result.payment?.status === "rejected" && result.payment.adminNote && (
              <p className="mt-4 rounded-sm border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-foreground/85">
                <strong>Reviewer note:</strong> {result.payment.adminNote}
              </p>
            )}
          </section>

          {/* items + totals */}
          <section className="rounded-sm border border-stone bg-card p-6">
            <h3 className="font-display text-lg">Items</h3>
            <ul className="mt-3 divide-y divide-stone">
              {result.items.map((i, idx) => (
                <li key={idx} className="flex items-start justify-between gap-4 py-3 text-sm">
                  <div>
                    <p className="font-medium">{i.productName}</p>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">
                      {i.color} · Size {i.size} · ×{i.quantity}
                    </p>
                  </div>
                  <p>{formatPKR(i.unitPrice * i.quantity)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-2 border-t border-stone pt-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd>{formatPKR(result.subtotal)}</dd>
              </div>
              {result.discountAmount > 0 && (
                <div className="flex justify-between text-gold">
                  <dt>Discount</dt>
                  <dd>−{formatPKR(result.discountAmount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{result.fulfillment === "pickup" ? "Pickup" : "Delivery"}</dt>
                <dd>{result.shippingFee === 0 ? "Free" : formatPKR(result.shippingFee)}</dd>
              </div>
              <div className="flex justify-between border-t border-stone pt-2.5 text-base font-medium">
                <dt>Total</dt>
                <dd>{formatPKR(result.total)}</dd>
              </div>
            </dl>
          </section>

          {/* payment */}
          {result.canUpload ? (
            <>
              <BankDetails
                bankName={settings.bankName}
                accountTitle={settings.accountTitle}
                iban={settings.iban}
                total={result.total}
                orderNo={result.orderNo}
              />
              <PaymentForm orderNo={result.orderNo} phone={phone} compact />
            </>
          ) : (
            result.payment && (
              <section className="rounded-sm border border-stone bg-card p-6 text-sm">
                <h3 className="font-display text-lg">Payment</h3>
                <p className="mt-2 text-muted-foreground">
                  Screenshot {result.payment.status} on {formatDateTime(result.payment.createdAt)}
                  {result.payment.transactionRef ? ` · Ref ${result.payment.transactionRef}` : ""}
                </p>
              </section>
            )
          )}
        </div>
      )}
    </div>
  );
}
