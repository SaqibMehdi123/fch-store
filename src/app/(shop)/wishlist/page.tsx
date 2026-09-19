"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Trash2, ShoppingBag } from "lucide-react";
import { useWishlist } from "@/lib/wishlist";
import { ProductCard } from "@/components/store/product-card";
import { SectionHeading } from "@/components/store/section-heading";
import type { ProductCardData } from "@/lib/products";

/**
 * Wishlist — localStorage-backed (guest-friendly, Phase 1).
 * Saved slugs are resolved into product data via /api/wishlist.
 */
export default function WishlistPage() {
  const { slugs, remove, clear } = useWishlist();
  const [items, setItems] = useState<ProductCardData[] | null>(null);
  const empty = slugs.length === 0;

  useEffect(() => {
    if (!slugs.length) return; // nothing to fetch — empty state renders directly
    let cancelled = false;
    fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slugs }),
    })
      .then((r) => r.json())
      .then((data: { items?: ProductCardData[] }) => {
        if (!cancelled) setItems(data.items ?? []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [slugs]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 lg:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-stone pb-6">
        <div>
          <p className="label-caps text-gold">Saved for later</p>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl">Your Wishlist</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {empty
              ? "No pieces saved yet"
              : items === null
                ? "Loading saved pieces…"
                : `${items.length} ${items.length === 1 ? "piece" : "pieces"} saved on this device`}
          </p>
        </div>
        {!empty && items && items.length > 0 && (
          <button
            type="button"
            onClick={clear}
            className="text-[12px] uppercase tracking-[0.14em] text-muted-foreground underline-offset-4 transition-colors hover:text-destructive hover:underline"
          >
            Clear wishlist
          </button>
        )}
      </div>

      {empty ? (
        <div className="mt-14 flex flex-col items-center rounded-sm border border-stone bg-card px-6 py-20 text-center">
          <Heart className="h-9 w-9 text-gold" strokeWidth={1.4} />
          <h2 className="mt-4 font-display text-2xl">Nothing saved yet</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Tap the heart on any product to keep it here — your picks stay saved on this device.
          </p>
          <Link href="/shop" className="btn-luxury mt-7">
            <ShoppingBag className="h-4 w-4" /> Browse the collection
          </Link>
        </div>
      ) : items === null ? (
        <div className="mt-16 flex justify-center" aria-busy="true" aria-live="polite">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" aria-hidden />
          <span className="sr-only">Loading wishlist</span>
        </div>
      ) : items.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">Saved items are no longer available.</p>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-9 lg:grid-cols-4">
          {items.map((p) => (
            <div key={p.slug} className="relative">
              <ProductCard product={p} />
              <button
                type="button"
                onClick={() => remove(p.slug)}
                aria-label={`Remove ${p.name} from wishlist`}
                className="mt-2 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <section className="mt-16 border-t border-stone pt-10">
        <SectionHeading
          eyebrow="Keep exploring"
          title="New arrivals this week"
          linkHref="/shop?sort=newest"
          linkLabel="Shop all new"
        />
      </section>
    </div>
  );
}
