import type { Metadata } from "next";

/**
 * Wishlist is a client page (localStorage-backed), so its metadata lives here.
 * Personal surface — kept out of search indexes.
 */
export const metadata: Metadata = {
  title: { absolute: "Wishlist — Fashion and Collection House" },
  description: "Pieces you've saved for later at FCH.",
  robots: { index: false, follow: true },
};

export default function WishlistLayout({ children }: { children: React.ReactNode }) {
  return children;
}
