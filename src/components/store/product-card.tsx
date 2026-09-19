import Link from "next/link";
import { discountPercent, formatPKR } from "@/lib/format";
import { WishlistHeart } from "@/components/store/wishlist-heart";
import { cn } from "@/lib/utils";
import type { ProductCardData } from "@/lib/products";

/**
 * Product card — editorial style: image-forward, minimal chrome.
 * Hover: secondary image cross-fade + subtle zoom; gold "SALE −N%" chip;
 * wishlist heart floats top-right; muted "Out of Stock" state.
 */
export function ProductCard({
  product,
  priority = false,
  className,
}: {
  product: ProductCardData;
  priority?: boolean;
  className?: string;
}) {
  const off = discountPercent(product.price, product.salePrice);

  return (
    <article className={cn("group relative", className)}>
      <div className="relative overflow-hidden rounded-sm bg-secondary/60">
        <Link
          href={`/product/${product.slug}`}
          aria-label={product.name}
          className="block"
        >
          <div className="relative aspect-[3/4]">
            {product.image ? (
              <>
                { }
                <img
                  src={product.image}
                  alt={product.name}
                  loading={priority ? "eager" : "lazy"}
                  className={cn(
                    "absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-out",
                    product.imageHover && "group-hover:opacity-0"
                  )}
                />
                {product.imageHover && (
                   
                  <img
                    src={product.imageHover}
                    alt=""
                    aria-hidden
                    loading="lazy"
                    className="absolute inset-0 h-full w-full scale-[1.04] object-cover opacity-0 transition-all duration-700 ease-out group-hover:opacity-100"
                  />
                )}
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                {product.name}
              </div>
            )}
          </div>
        </Link>

        {/* badges */}
        <div className="pointer-events-none absolute left-2.5 top-2.5 flex flex-col gap-1.5">
          {off !== null && (
            <span className="bg-gold px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
              Sale −{off}%
            </span>
          )}
          {!product.inStock && (
            <span className="bg-foreground/85 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-background">
              Out of Stock
            </span>
          )}
        </div>

        {/* wishlist */}
        <WishlistHeart
          slug={product.slug}
          label={product.name}
          className="absolute right-2.5 top-2.5 opacity-100 sm:opacity-0 sm:transition-opacity sm:duration-300 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
        />
      </div>

      {/* details */}
      <div className="pt-3">
        <p className="label-caps text-[10px] text-muted-foreground">{product.categoryName}</p>
        <h3 className="mt-1 text-[15px] font-medium leading-snug">
          <Link href={`/product/${product.slug}`} className="transition-colors hover:text-gold">
            {product.name}
          </Link>
        </h3>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className={cn("text-[15px] font-semibold", off !== null && "text-gold")}>
            {formatPKR(product.salePrice ?? product.price)}
          </span>
          {product.salePrice !== null && (
            <span className="text-xs text-muted-foreground line-through">{formatPKR(product.price)}</span>
          )}
        </div>
      </div>
    </article>
  );
}
