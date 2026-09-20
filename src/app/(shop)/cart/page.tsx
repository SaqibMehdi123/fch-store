import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { CartView } from "@/components/store/cart-view";

export const metadata: Metadata = {
  title: { absolute: "Shopping Cart — Fashion and Collection House" },
  description: "Review your bag, apply a coupon and check free-shipping progress before checkout.",
  robots: { index: false, follow: true },
};

export default async function CartPage() {
  const settings = await getSettings();
  return <CartView freeShippingThreshold={settings.freeShippingThreshold} />;
}
