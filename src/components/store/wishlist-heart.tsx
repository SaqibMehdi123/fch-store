"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWishlist } from "@/lib/wishlist";

/**
 * Wishlist toggle heart. Drop it inside any card or the product page.
 * `saved` state syncs across the whole app and browser tabs.
 */
export function WishlistHeart({
  slug,
  className,
  size = "md",
  label = "heart",
}: {
  slug: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  label?: string;
}) {
  const { has, toggle } = useWishlist();
  const saved = has(slug);

  const iconSize = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5";

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Remove ${label} from wishlist` : `Add ${label} to wishlist`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(slug);
      }}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-full bg-background/90 shadow-sm backdrop-blur transition-all duration-200",
        "hover:scale-110 hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
        className
      )}
    >
      <Heart
        className={cn(iconSize, "transition-colors", saved ? "fill-gold text-gold" : "text-foreground/70")}
        strokeWidth={1.8}
      />
    </button>
  );
}

/** Wishlist count badge used in the header. */
export function WishlistCountBadge() {
  const { count } = useWishlist();
  if (count === 0) return null;
  return (
    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-semibold leading-none text-white">
      {count > 9 ? "9+" : count}
    </span>
  );
}
