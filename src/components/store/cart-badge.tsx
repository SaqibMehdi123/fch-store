"use client";

import { useCart } from "@/lib/cart";

/** Gold count bubble on the header cart icon — hidden when the cart is empty. */
export function CartCountBadge() {
  const { count } = useCart();
  if (count === 0) return null;
  return (
    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-semibold leading-none text-white">
      {count > 9 ? "9+" : count}
    </span>
  );
}
