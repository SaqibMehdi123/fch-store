"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Lock, MapPin, Truck } from "lucide-react";
import { toast } from "sonner";
import { useCart, getCartCoupon } from "@/lib/cart";
import { formatPKR } from "@/lib/format";
import { createOrder, validateCoupon } from "@/app/actions/checkout";

type Zone = { id: string; name: string; cities: string; rate: number; etaDays: number };

/**
 * Guest checkout — contact + address details, delivery vs in-store pickup,
 * zone-based shipping with free-above-threshold, and a server-validated
 * summary. On success the shopper lands on the payment instructions page.
 */
export function CheckoutForm({
  zones,
  freeShippingThreshold,
  pickupAddress,
}: {
  zones: Zone[];
  freeShippingThreshold: number;
  pickupAddress: string;
}) {
  const { items, subtotal, count, clear } = useCart();
  const router = useRouter();

  const [fulfillment, setFulfillment] = useState<"delivery" | "pickup">("delivery");
  const [zoneId, setZoneId] = useState(zones[0]?.id ?? "");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    note: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  const couponCode = useMemo(() => getCartCoupon(), []);
  const [coupon, setCoupon] = useState<{ label: string; discount: number } | null>(null);

  // preview the server-validated coupon discount so the total shown matches
  // what the order will actually charge (server re-validates at placement)
  useEffect(() => {
    if (!couponCode) return;
    let cancelled = false;
    validateCoupon(couponCode, subtotal).then((res) => {
      if (!cancelled) setCoupon(res.ok ? { label: res.label, discount: res.discount } : null);
    });
    return () => {
      cancelled = true;
    };
  }, [couponCode, subtotal]);

  const discount = coupon?.discount ?? 0;
  const zone = zones.find((z) => z.id === zoneId);
  const shipping = fulfillment === "pickup" || subtotal - discount >= freeShippingThreshold ? 0 : (zone?.rate ?? 0);
  const total = Math.max(0, subtotal - discount) + shipping;

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center px-6 py-24 text-center">
        <h1 className="font-display text-3xl">Nothing to check out</h1>
        <p className="mt-2 text-sm text-muted-foreground">Add a few pieces to your bag first.</p>
        <Link href="/shop" className="btn-luxury mt-7">Browse the collection</Link>
      </div>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    startTransition(async () => {
      const res = await createOrder({
        items: items.map((i) => ({ variantId: i.variantId, qty: i.qty })),
        fulfillment,
        name: form.name,
        phone: form.phone,
        email: form.email,
        address: form.address || undefined,
        city: form.city || undefined,
        zoneId: fulfillment === "delivery" ? zoneId : undefined,
        couponCode: couponCode ?? undefined,
        customerNote: form.note || undefined,
      });
      if (res.ok) {
        clear();
        toast.success(`Order ${res.orderNo} placed`);
        router.push(`/order/${res.orderNo}?p=${encodeURIComponent(form.phone)}`);
      } else {
        setErrors(res.fieldErrors ?? {});
        toast.error(res.message);
      }
    });
  };

  const fieldCls = (key: string) =>
    `h-11 w-full rounded-sm border bg-background px-3 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-gold ${
      errors[key] ? "border-destructive" : "border-stone"
    }`;

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 lg:py-12">
      <header className="border-b border-stone pb-6">
        <h1 className="font-display text-3xl sm:text-4xl">Checkout</h1>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Lock className="h-3.5 w-3.5" /> Guest checkout — no account needed
        </p>
      </header>

      <form onSubmit={submit} className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]" noValidate>
        <div className="space-y-8">
          {/* contact */}
          <section>
            <h2 className="font-display text-xl">Contact Details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="co-name" className="label-caps mb-1.5 block">Full name</label>
                <input id="co-name" autoComplete="name" value={form.name} onChange={set("name")} placeholder="Ayesha Khan" className={fieldCls("name")} />
                {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
              </div>
              <div>
                <label htmlFor="co-phone" className="label-caps mb-1.5 block">Mobile number</label>
                <input id="co-phone" type="tel" autoComplete="tel" inputMode="tel" value={form.phone} onChange={set("phone")} placeholder="03XX-XXXXXXX" className={fieldCls("phone")} />
                {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone}</p>}
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="co-email" className="label-caps mb-1.5 block">Email</label>
                <input id="co-email" type="email" autoComplete="email" value={form.email} onChange={set("email")} placeholder="you@example.com" className={fieldCls("email")} />
                <p className="mt-1 text-[11px] text-muted-foreground">Order confirmation and payment instructions go here.</p>
                {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
              </div>
            </div>
          </section>

          {/* fulfillment */}
          <section>
            <h2 className="font-display text-xl">Fulfillment</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setFulfillment("delivery")}
                aria-pressed={fulfillment === "delivery"}
                className={`flex items-start gap-3 rounded-sm border p-4 text-left transition-colors ${
                  fulfillment === "delivery" ? "border-gold bg-gold/5" : "border-stone hover:border-foreground/40"
                }`}
              >
                <Truck className="mt-0.5 h-5 w-5 text-gold" strokeWidth={1.6} />
                <span>
                  <span className="block text-sm font-medium">Home delivery</span>
                  <span className="mt-0.5 block text-[12px] text-muted-foreground">Nationwide, 2–6 working days</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => setFulfillment("pickup")}
                aria-pressed={fulfillment === "pickup"}
                className={`flex items-start gap-3 rounded-sm border p-4 text-left transition-colors ${
                  fulfillment === "pickup" ? "border-gold bg-gold/5" : "border-stone hover:border-foreground/40"
                }`}
              >
                <Building2 className="mt-0.5 h-5 w-5 text-gold" strokeWidth={1.6} />
                <span>
                  <span className="block text-sm font-medium">In-store pickup</span>
                  <span className="mt-0.5 block text-[12px] text-muted-foreground">{pickupAddress || "Visit our store"} — no fee</span>
                </span>
              </button>
            </div>

            {fulfillment === "delivery" && (
              <div className="mt-5 space-y-4">
                <div>
                  <label htmlFor="co-zone" className="label-caps mb-1.5 block">Delivery zone</label>
                  <select
                    id="co-zone"
                    value={zoneId}
                    onChange={(e) => setZoneId(e.target.value)}
                    className="h-11 w-full rounded-sm border border-stone bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
                  >
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name} — {formatPKR(z.rate)} ({z.etaDays} {z.etaDays === 1 ? "day" : "days"})
                        {z.rate === 0 ? " — free" : ""}
                      </option>
                    ))}
                  </select>
                  {zone && <p className="mt-1.5 text-[11px] text-muted-foreground">Covers: {zone.cities}</p>}
                </div>
                <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
                  <div>
                    <label htmlFor="co-address" className="label-caps mb-1.5 block">Street address</label>
                    <input id="co-address" autoComplete="street-address" value={form.address} onChange={set("address")} placeholder="House / street / area" className={fieldCls("address")} />
                    {errors.address && <p className="mt-1 text-xs text-destructive">{errors.address}</p>}
                  </div>
                  <div>
                    <label htmlFor="co-city" className="label-caps mb-1.5 block">City</label>
                    <input id="co-city" autoComplete="address-level2" value={form.city} onChange={set("city")} placeholder="Karachi" className={fieldCls("city")} />
                    {errors.city && <p className="mt-1 text-xs text-destructive">{errors.city}</p>}
                  </div>
                </div>
              </div>
            )}

            {fulfillment === "pickup" && (
              <p className="mt-5 flex items-start gap-2 rounded-sm border border-stone bg-card p-4 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                Collect from {pickupAddress || "our store"} once your payment is confirmed — we&apos;ll WhatsApp you when it&apos;s ready.
              </p>
            )}
          </section>

          {/* note */}
          <section>
            <h2 className="font-display text-xl">Order Note <span className="text-sm font-normal text-muted-foreground">(optional)</span></h2>
            <textarea
              id="co-note"
              value={form.note}
              onChange={set("note")}
              rows={3}
              placeholder="Gift wrapping, delivery instructions…"
              className="mt-3 w-full rounded-sm border border-stone bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </section>
        </div>

        {/* summary */}
        <aside className="h-fit rounded-sm border border-stone bg-card p-6 lg:sticky lg:top-24">
          <h2 className="font-display text-xl">Your Order</h2>
          <ul className="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1">
            {items.map((i) => (
              <li key={i.variantId} className="flex items-center gap-3 text-sm">
                <span className="flex h-14 w-11 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-stone">
                  {i.image && (
                    <img src={i.image} alt="" className="h-full w-full object-cover" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{i.name}</span>
                  <span className="block text-[11px] text-muted-foreground">
                    {i.color} · {i.size} · ×{i.qty}
                  </span>
                </span>
                <span className="shrink-0">{formatPKR(i.price * i.qty)}</span>
              </li>
            ))}
          </ul>

          <dl className="mt-5 space-y-2.5 border-t border-stone pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal ({count} items)</dt>
              <dd>{formatPKR(subtotal)}</dd>
            </div>
            {couponCode && (
              <div className="flex justify-between text-gold">
                <dt>
                  Coupon {couponCode}
                  {coupon && <span className="ml-1 text-[11px] text-muted-foreground">({coupon.label})</span>}
                </dt>
                <dd>{coupon ? `−${formatPKR(coupon.discount)}` : "verified at placement"}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{fulfillment === "pickup" ? "Pickup" : "Delivery"}</dt>
              <dd>{fulfillment === "pickup" ? "Free" : shipping === 0 ? "Free" : formatPKR(shipping)}</dd>
            </div>
            <div className="flex justify-between border-t border-stone pt-3 text-base font-medium">
              <dt>Total</dt>
              <dd>{formatPKR(total)}</dd>
            </div>
          </dl>

          <button type="submit" disabled={pending} className="btn-luxury mt-6 w-full disabled:opacity-60">
            {pending ? "Placing order…" : `Place Order — ${formatPKR(total)}`}
          </button>
          <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">
            You&apos;ll transfer the amount to our bank account (or Raast) and upload the screenshot next.
          </p>
        </aside>
      </form>
    </div>
  );
}
