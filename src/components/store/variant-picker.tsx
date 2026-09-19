"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ShoppingBag, MessageCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { sortSizes } from "@/lib/sizes";
import { useCart } from "@/lib/cart";
import { SizeChartDialog } from "@/components/store/size-chart-dialog";
import type { VariantOption } from "@/lib/products";

/**
 * Colour + size pickers with per-variant stock.
 * Out-of-stock variants stay visible but disabled, labelled "Out of Stock".
 */
export function VariantPicker({
  slug,
  productName,
  image,
  price,
  variants,
  whatsappNumber,
}: {
  slug: string;
  productName: string;
  image: string | null;
  price: number;
  variants: VariantOption[];
  whatsappNumber: string;
}) {
  const { add } = useCart();
  const colors = useMemo(() => {
    const map = new Map<string, { name: string; hex: string; inStock: boolean }>();
    for (const v of variants) {
      const cur = map.get(v.color);
      if (cur) cur.inStock = cur.inStock || v.stock > 0;
      else map.set(v.color, { name: v.color, hex: v.colorHex, inStock: v.stock > 0 });
    }
    return [...map.values()];
  }, [variants]);

  const firstAvailableColor = colors.find((c) => c.inStock) ?? colors[0];
  const [color, setColor] = useState(firstAvailableColor?.name ?? "");
  const [size, setSize] = useState<string | null>(null);

  const sizesForColor = useMemo(
    () => sortSizes(variants.filter((v) => v.color === color).map((v) => v.size)),
    [variants, color]
  );

  const stockOf = (c: string, s: string) => variants.find((v) => v.color === c && v.size === s)?.stock ?? 0;

  // default size: first in-stock for the selected colour
  const effectiveSize = size && sizesForColor.includes(size) ? size : sizesForColor.find((s) => stockOf(color, s) > 0) ?? sizesForColor[0] ?? null;

  const selected = effectiveSize ? variants.find((v) => v.color === color && v.size === effectiveSize) : undefined;
  const stock = selected?.stock ?? 0;
  const outOfStock = !selected || stock === 0;

  const waDigits = whatsappNumber.replace(/\D/g, "");
  const waLink =
    waDigits.length >= 10
      ? `https://wa.me/${waDigits}?text=${encodeURIComponent(
          `Hello FCH! I'd like to order:\n\n${productName}\nColour: ${color}\nSize: ${effectiveSize ?? "-"}\nSKU: ${selected?.sku ?? "-"}\n\nPlease share payment details.`
        )}`
      : null;

  return (
    <div className="space-y-6">
      {/* colour */}
      <div>
        <div className="flex items-baseline justify-between">
          <p className="label-caps">
            Colour: <span className="text-foreground">{color}</span>
          </p>
        </div>
        <div className="mt-3 flex flex-wrap gap-2.5">
          {colors.map((c) => (
            <button
              key={c.name}
              type="button"
              aria-pressed={c.name === color}
              title={c.inStock ? c.name : `${c.name} — Out of Stock`}
              onClick={() => {
                setColor(c.name);
                setSize(null);
              }}
              className={cn(
                "relative inline-flex h-10 w-10 items-center justify-center rounded-full border transition-all",
                c.name === color
                  ? "border-gold ring-1 ring-gold ring-offset-2 ring-offset-background"
                  : "border-stone hover:border-foreground/50",
                !c.inStock && "opacity-55"
              )}
            >
              <span className="h-7 w-7 rounded-full border border-black/10" style={{ backgroundColor: c.hex }} aria-hidden />
              {!c.inStock && (
                <span aria-hidden className="absolute inset-0 flex items-center justify-center">
                  <span className="h-[1.5px] w-10 rotate-45 bg-foreground/70" />
                </span>
              )}
              <span className="sr-only">{c.name}{c.inStock ? "" : " (out of stock)"}</span>
            </button>
          ))}
        </div>
      </div>

      {/* size */}
      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="label-caps">
            Size: <span className="text-foreground">{effectiveSize ?? "—"}</span>
          </p>
          <SizeChartDialog />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {sizesForColor.map((s) => {
            const st = stockOf(color, s);
            const oos = st === 0;
            const isActive = s === effectiveSize;
            return (
              <button
                key={s}
                type="button"
                disabled={oos}
                aria-pressed={isActive}
                title={oos ? `${s} — Out of Stock` : `${s} — ${st} in stock`}
                onClick={() => setSize(s)}
                className={cn(
                  "relative inline-flex h-11 min-w-14 items-center justify-center rounded-sm border px-3 text-sm transition-all",
                  isActive
                    ? "border-foreground bg-foreground text-background"
                    : "border-stone text-foreground/85 hover:border-foreground/50",
                  oos && "cursor-not-allowed border-stone/70 text-muted-foreground/60 line-through hover:border-stone/70"
                )}
              >
                {s}
                {oos && <span className="sr-only"> — Out of Stock</span>}
              </button>
            );
          })}
        </div>
        {outOfStock ? (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-sm bg-destructive/10 px-2.5 py-1.5 text-[12px] font-medium tracking-wide text-destructive">
            Out of Stock — pick another size or colour
          </p>
        ) : stock <= 3 ? (
          <p className="mt-3 text-[12px] font-medium tracking-wide text-gold">
            Only {stock} left — order soon
          </p>
        ) : (
          <p className="mt-3 inline-flex items-center gap-1.5 text-[12px] tracking-wide text-emerald-700">
            <Check className="h-3.5 w-3.5" /> In stock, ready to ship
          </p>
        )}
      </div>

      {/* actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          disabled={outOfStock || !selected}
          onClick={() => {
            if (!selected) return;
            add({
              variantId: selected.id,
              slug,
              name: productName,
              color,
              colorHex: selected.colorHex,
              size: selected.size,
              price,
              image,
            });
            toast(`${productName} added to bag`, {
              description: `${color} · Size ${selected.size} — ${selected.sku}`,
              action: { label: "View bag", onClick: () => (window.location.href = "/cart") },
            });
          }}
          className="btn-luxury flex-1 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ShoppingBag className="h-4 w-4" /> {outOfStock ? "Out of Stock" : "Add to Cart"}
        </button>
        {waLink && (
          <a href={waLink} target="_blank" rel="noopener noreferrer" className="btn-outline-luxury flex-1">
            <MessageCircle className="h-4 w-4" /> Order on WhatsApp
          </a>
        )}
      </div>

      {selected && (
        <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          SKU: {selected.sku}
          {" · "}
          <Link href="/faq" className="underline-offset-2 hover:text-gold hover:underline">
            Delivery & payment info
          </Link>
        </p>
      )}
    </div>
  );
}
