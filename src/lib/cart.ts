"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * FCH shopping cart — localStorage-backed store for guest shoppers.
 * Items are keyed by variantId; the server re-validates prices, stock and
 * coupons at checkout, so this store is UI state only (display snapshots).
 * Components subscribe via useSyncExternalStore; state syncs across tabs.
 */

const KEY = "fch-cart-v1";
const EVENT = "fch:cart";

export type CartItem = {
  variantId: string;
  slug: string;
  name: string;
  color: string;
  colorHex: string;
  size: string;
  price: number; // effective unit price snapshot (display only)
  image: string | null;
  qty: number;
};

export type CartApi = {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  setQty: (variantId: string, qty: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
};

type StoredCart = { items: CartItem[]; coupon: string | null };

function read(): StoredCart {
  if (typeof window === "undefined") return { items: [], coupon: null };
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === "object" && Array.isArray((parsed as StoredCart).items)) {
      const items = (parsed as StoredCart).items.filter(
        (i): i is CartItem =>
          !!i && typeof i === "object" && typeof i.variantId === "string" && typeof i.qty === "number" && i.qty > 0
      );
      return { items, coupon: typeof (parsed as StoredCart).coupon === "string" ? (parsed as StoredCart).coupon : null };
    }
    return { items: [], coupon: null };
  } catch {
    return { items: [], coupon: null };
  }
}

function write(cart: StoredCart) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(cart));
  } catch {
    // storage full / private mode — non-fatal
  }
  window.dispatchEvent(new Event(EVENT));
}

let cache: StoredCart | null = null;

// stable empty snapshot for SSR — must be cached or React loops
const EMPTY_SNAPSHOT: StoredCart = { items: [], coupon: null };

function getSnapshot(): StoredCart {
  if (typeof window === "undefined") return EMPTY_SNAPSHOT;
  if (!cache) cache = read();
  return cache;
}

const listeners = new Set<() => void>();

if (typeof window !== "undefined") {
  window.addEventListener(EVENT, () => {
    cache = read();
    listeners.forEach((l) => l());
  });
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) {
      cache = read();
      listeners.forEach((l) => l());
    }
  });
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** React hook — subscribe the component to cart state. */
export function useCart(): CartApi {
  const cart = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY_SNAPSHOT);

  const add = useCallback((item: Omit<CartItem, "qty">, qty = 1) => {
    const current = getSnapshot();
    const existing = current.items.find((i) => i.variantId === item.variantId);
    const items = existing
      ? current.items.map((i) => (i.variantId === item.variantId ? { ...i, qty: Math.min(i.qty + qty, 20), price: item.price } : i))
      : [...current.items, { ...item, qty: Math.min(qty, 20) }];
    write({ ...current, items });
  }, []);

  const setQty = useCallback((variantId: string, qty: number) => {
    const current = getSnapshot();
    if (qty <= 0) {
      write({ ...current, items: current.items.filter((i) => i.variantId !== variantId) });
      return;
    }
    write({ ...current, items: current.items.map((i) => (i.variantId === variantId ? { ...i, qty: Math.min(qty, 20) } : i)) });
  }, []);

  const remove = useCallback((variantId: string) => {
    const current = getSnapshot();
    write({ ...current, items: current.items.filter((i) => i.variantId !== variantId) });
  }, []);

  const clear = useCallback(() => {
    const current = getSnapshot();
    write({ ...current, items: [], coupon: null });
  }, []);

  return {
    items: cart.items,
    count: cart.items.reduce((n, i) => n + i.qty, 0),
    subtotal: cart.items.reduce((n, i) => n + i.price * i.qty, 0),
    add,
    setQty,
    remove,
    clear,
  };
}

/** Coupon code carried from the cart page to checkout (non-reactive read). */
export function getCartCoupon(): string | null {
  return getSnapshot().coupon;
}

export function setCartCoupon(code: string | null) {
  write({ ...getSnapshot(), coupon: code });
}
