"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingBag, Tag, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useCart, getCartCoupon, setCartCoupon } from "@/lib/cart";
import { formatPKR } from "@/lib/format";
import { validateCoupon, type CouponValidation } from "@/app/actions/checkout";

/**
 * Cart UI — quantity editing, coupon validation (server-side rules), and a
 * free-shipping progress bar. Totals here are indicative; the authoritative
 * amounts are recomputed server-side at order creation.
 */
export function CartView({ freeShippingThreshold }: { freeShippingThreshold: number }) {
  const { items, count, subtotal, setQty, remove, clear } = useCart();
  const router = useRouter();
  const [couponInput, setCouponInput] = useState(getCartCoupon() ?? "");
  const [coupon, setCoupon] = useState<CouponValidation | null>(null);
  const [checking, startCheck] = useTransition();

  const remaining = Math.max(0, freeShippingThreshold - subtotal);
  const progress = Math.min(100, freeShippingThreshold > 0 ? (subtotal / freeShippingThreshold) * 100 : 100);

  const applyCoupon = () => {
    const code = couponInput.trim();
    if (!code) return;
    startCheck(async () => {
      const res = await validateCoupon(code, subtotal);
      if (res.ok) {
        setCoupon(res);
        setCartCoupon(code.toUpperCase());
        toast.success(`Coupon ${code.toUpperCase()} applied — ${res.label}`);
      } else {
        setCoupon(null);
        setCartCoupon(null);
        toast.error(res.message);
      }
    });
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCartCoupon(null);
    setCouponInput("");
  };

  const discount = coupon?.ok ? coupon.discount : 0;
  const total = Math.max(0, subtotal - discount);

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center px-6 py-24 text-center">
        <ShoppingBag className="h-10 w-10 text-gold" strokeWidth={1.4} />
        <h1 className="mt-5 font-display text-3xl">Your bag is empty</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Explore the latest pret, unstitched and formal pieces — new designs land every week.
        </p>
        <Link href="/shop" className="btn-luxury mt-7">
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 lg:py-12">
      <header className="border-b border-stone pb-6">
        <h1 className="font-display text-3xl sm:text-4xl">Shopping Bag</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {count} {count === 1 ? "item" : "items"} — reserved for you once the order is placed
        </p>
      </header>

      {/* free-shipping progress */}
      <div className="mt-6 rounded-sm border border-stone bg-card p-4">
        {remaining > 0 ? (
          <p className="text-sm text-foreground/85">
            You&apos;re <strong className="text-gold">{formatPKR(remaining)}</strong> away from free nationwide delivery.
          </p>
        ) : (
          <p className="text-sm text-foreground/85">
            <strong className="text-gold">Free nationwide delivery</strong> unlocked on this order.
          </p>
        )}
        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-stone">
          <div
            className="h-full rounded-full bg-gold transition-all duration-500"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Free shipping progress"
          />
        </div>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        {/* items */}
        <div>
          <ul className="divide-y divide-stone border-y border-stone">
            {items.map((item) => (
              <li key={item.variantId} className="flex gap-4 py-5">
                <Link href={`/product/${item.slug}`} className="relative h-28 w-24 shrink-0 overflow-hidden rounded-sm bg-stone sm:h-36 sm:w-28">
                  {item.image && (
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  )}
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/product/${item.slug}`} className="block truncate font-medium transition-colors hover:text-gold">
                        {item.name}
                      </Link>
                      <p className="mt-1 flex items-center gap-1.5 text-[12px] text-muted-foreground">
                        <span className="inline-block h-3 w-3 rounded-full border border-black/10" style={{ backgroundColor: item.colorHex }} aria-hidden />
                        {item.color} · Size {item.size}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        remove(item.variantId);
                        toast("Removed from bag");
                      }}
                      aria-label={`Remove ${item.name} from bag`}
                      className="text-muted-foreground transition-colors hover:text-gold"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-auto flex items-end justify-between pt-3">
                    <div className="inline-flex items-center rounded-sm border border-stone">
                      <button
                        type="button"
                        onClick={() => setQty(item.variantId, item.qty - 1)}
                        aria-label="Decrease quantity"
                        className="inline-flex h-8 w-8 items-center justify-center transition-colors hover:text-gold"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm" aria-live="polite">{item.qty}</span>
                      <button
                        type="button"
                        onClick={() => setQty(item.variantId, item.qty + 1)}
                        aria-label="Increase quantity"
                        className="inline-flex h-8 w-8 items-center justify-center transition-colors hover:text-gold"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-sm">
                      <span className="font-medium">{formatPKR(item.price * item.qty)}</span>
                      {item.qty > 1 && <span className="ml-1.5 text-muted-foreground">({formatPKR(item.price)} each)</span>}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => {
              clear();
              toast("Bag cleared");
            }}
            className="mt-4 text-[11px] uppercase tracking-[0.14em] text-muted-foreground underline-offset-2 hover:text-gold hover:underline"
          >
            Clear bag
          </button>
        </div>

        {/* summary */}
        <aside className="h-fit rounded-sm border border-stone bg-card p-6 lg:sticky lg:top-24">
          <h2 className="font-display text-xl">Order Summary</h2>

          {/* coupon */}
          <div className="mt-5">
            <label htmlFor="coupon" className="label-caps mb-2 block">Coupon code</label>
            {coupon?.ok ? (
              <div className="flex items-center justify-between rounded-sm border border-gold/40 bg-gold/10 px-3 py-2.5">
                <p className="flex items-center gap-2 text-sm text-foreground">
                  <Tag className="h-3.5 w-3.5 text-gold" />
                  {coupon.code} — {coupon.label}
                </p>
                <button type="button" onClick={removeCoupon} aria-label="Remove coupon" className="text-muted-foreground hover:text-gold">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  id="coupon"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                  placeholder="e.g. WELCOME10"
                  className="h-10 w-full rounded-sm border border-stone bg-background px-3 text-sm uppercase tracking-wide placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-gold"
                />
                <button
                  type="button"
                  onClick={applyCoupon}
                  disabled={checking || !couponInput.trim()}
                  className="btn-outline-luxury h-10 shrink-0 px-4 text-[11px] disabled:opacity-50"
                >
                  {checking ? "Checking…" : "Apply"}
                </button>
              </div>
            )}
          </div>

          <dl className="mt-5 space-y-2.5 border-t border-stone pt-5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{formatPKR(subtotal)}</dd>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-gold">
                <dt>Discount</dt>
                <dd>−{formatPKR(discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Delivery</dt>
              <dd className="text-muted-foreground">Chosen at checkout</dd>
            </div>
            <div className="flex justify-between border-t border-stone pt-3 text-base font-medium">
              <dt>Total</dt>
              <dd>{formatPKR(total)}</dd>
            </div>
          </dl>

          <button type="button" onClick={() => router.push("/checkout")} className="btn-luxury mt-6 w-full">
            Proceed to Checkout
          </button>
          <Link
            href="/shop"
            className="mt-3 block text-center text-[11px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-gold"
          >
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
