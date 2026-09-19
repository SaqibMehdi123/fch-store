import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminOrder } from "@/lib/admin/queries";
import { formatPKR, formatDateTime, ORDER_STATUS_LABELS } from "@/lib/format";
import { OrderActions } from "@/components/admin/order-actions";

export const metadata: Metadata = {
  title: "Order Detail",
  robots: { index: false, follow: false },
};

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ orderNo: string }> }) {
  const { orderNo } = await params;
  const order = await getAdminOrder(orderNo);
  if (!order) notFound();

  const latestPayment = order.payments[0];

  return (
    <div className="animate-fade-in">
      <nav className="text-xs text-muted-foreground">
        <Link href="/admin/orders" className="transition-colors hover:text-gold">
          Orders
        </Link>
        <span aria-hidden className="mx-2">/</span>
        <span className="text-foreground">{order.orderNo}</span>
      </nav>

      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">{order.orderNo}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Placed {formatDateTime(order.createdAt)} · {order.fulfillment === "pickup" ? "In-store pickup" : "Home delivery"}
          </p>
        </div>
        <span className="rounded-sm border border-stone bg-card px-3 py-1.5 text-xs uppercase tracking-wide">
          {ORDER_STATUS_LABELS[order.status] ?? order.status}
        </span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* items */}
          <section className="rounded-sm border border-stone bg-card">
            <h2 className="border-b border-stone px-5 py-4 font-display text-lg">Items</h2>
            <ul className="divide-y divide-stone">
              {order.items.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                  <span>
                    {i.productName}
                    <span className="block text-xs text-muted-foreground">
                      {i.color} · {i.size} · ×{i.quantity}
                    </span>
                  </span>
                  <span>{formatPKR(i.unitPrice * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="space-y-1.5 border-t border-stone px-5 py-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd>{formatPKR(order.subtotal)}</dd>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-gold">
                  <dt>Discount {order.coupon ? `(${order.coupon.code})` : ""}</dt>
                  <dd>−{formatPKR(order.discountAmount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Delivery</dt>
                <dd>{order.shippingFee === 0 ? "Free" : formatPKR(order.shippingFee)}</dd>
              </div>
              <div className="flex justify-between border-t border-stone pt-2 text-base font-medium">
                <dt>Total</dt>
                <dd>{formatPKR(order.total)}</dd>
              </div>
            </dl>
          </section>

          {/* payments */}
          <section className="rounded-sm border border-stone bg-card">
            <h2 className="border-b border-stone px-5 py-4 font-display text-lg">Payments</h2>
            {order.payments.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted-foreground">No screenshot submitted yet.</p>
            ) : (
              <ul className="divide-y divide-stone">
                {order.payments.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 text-sm">
                    <div>
                      <p>
                        {formatPKR(p.amount)} ·{" "}
                        <span
                          className={
                            p.status === "approved" ? "text-emerald-700" : p.status === "rejected" ? "text-destructive" : "text-gold"
                          }
                        >
                          {p.status}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Sender: {p.senderName ?? "—"} · Ref: {p.transactionRef ?? "—"} · {formatDateTime(p.createdAt)}
                        {p.adminNote && <> · note: “{p.adminNote}”</>}
                      </p>
                    </div>
                    {p.screenshotUrl && (
                      <Link
                        href={p.screenshotUrl}
                        target="_blank"
                        className="text-xs text-gold transition-colors hover:underline"
                      >
                        Open screenshot ↗
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* customer */}
          <section className="rounded-sm border border-stone bg-card">
            <h2 className="border-b border-stone px-5 py-4 font-display text-lg">Customer</h2>
            <dl className="grid gap-x-6 gap-y-3 px-5 py-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Name</dt>
                <dd>{order.customerName}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Phone</dt>
                <dd>{order.phone}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Email</dt>
                <dd className="break-all">{order.email}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  {order.fulfillment === "pickup" ? "Pickup" : "Delivering to"}
                </dt>
                <dd>
                  {order.address}
                  <span className="block text-muted-foreground">{order.city}</span>
                  {order.zone && (
                    <span className="block text-xs text-muted-foreground">
                      {order.zone.name} · {formatPKR(order.zone.rate)} · {order.zone.etaDays} day ETA
                    </span>
                  )}
                </dd>
              </div>
              {order.customerNote && (
                <div className="sm:col-span-2">
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Customer note</dt>
                  <dd className="italic">“{order.customerNote}”</dd>
                </div>
              )}
              {order.courierName && (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">Courier</dt>
                  <dd>
                    {order.courierName}
                    {order.trackingNumber && <span className="block text-muted-foreground">{order.trackingNumber}</span>}
                  </dd>
                </div>
              )}
            </dl>
          </section>
        </div>

        {/* actions rail */}
        <div className="space-y-6">
          <OrderActions
            orderNo={order.orderNo}
            status={order.status}
            courierName={order.courierName ?? ""}
            trackingNumber={order.trackingNumber ?? ""}
          />

          {/* email log */}
          <section className="rounded-sm border border-stone bg-card">
            <h2 className="border-b border-stone px-5 py-4 font-display text-lg">Email Log</h2>
            {order.emails.length === 0 ? (
              <p className="px-5 py-4 text-xs text-muted-foreground">No emails queued for this order.</p>
            ) : (
              <ul className="divide-y divide-stone">
                {order.emails.map((e) => (
                  <li key={e.id} className="flex items-center justify-between px-5 py-2.5 text-xs">
                    <span className="uppercase tracking-wide">{e.template}</span>
                    <span className="text-muted-foreground">{formatDateTime(e.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="border-t border-stone px-5 py-3 text-[11px] text-muted-foreground">
              Emails are queued and send automatically once the Phase 5 mailer is connected.
            </p>
          </section>
        </div>
      </div>

      {latestPayment && <span className="sr-only">Latest payment status: {latestPayment.status}</span>}
    </div>
  );
}
