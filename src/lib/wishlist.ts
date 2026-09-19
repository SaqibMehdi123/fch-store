"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * FCH wishlist — localStorage-backed store for guest shoppers (Phase 1).
 * Slugs are persisted as a JSON array; components subscribe via
 * useSyncExternalStore and stay in sync across tabs (storage event).
 */

const KEY = "fch-wishlist-v1";
const EVENT = "fch:wishlist";

export type WishlistApi = {
  slugs: string[];
  count: number;
  has: (slug: string) => boolean;
  toggle: (slug: string) => void;
  remove: (slug: string) => void;
  clear: () => void;
};

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}

function write(slugs: string[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(slugs));
  } catch {
    // storage full / private mode — non-fatal
  }
  window.dispatchEvent(new Event(EVENT));
}

let cache: string[] | null = null;

// stable empty snapshot for SSR — must be cached or React loops
const EMPTY_SNAPSHOT: string[] = [];

function getSnapshot(): string[] {
  if (typeof window === "undefined") return [];
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

/** React hook — subscribe the component to wishlist state. */
export function useWishlist(): WishlistApi {
  const slugs = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY_SNAPSHOT);

  const has = useCallback((slug: string) => slugs.includes(slug), [slugs]);

  const toggle = useCallback((slug: string) => {
    const cur = read();
    write(cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug]);
  }, []);

  const remove = useCallback((slug: string) => {
    write(read().filter((s) => s !== slug));
  }, []);

  const clear = useCallback(() => write([]), []);

  return { slugs, count: slugs.length, has, toggle, remove, clear };
}
