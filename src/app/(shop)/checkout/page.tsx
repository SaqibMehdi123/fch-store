import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { toNumber } from "@/lib/format";
import { CheckoutForm } from "@/components/store/checkout-form";

export const metadata: Metadata = {
  title: { absolute: "Checkout — Fashion and Collection House" },
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const [zones, settings] = await Promise.all([
    db.deliveryZone.findMany({ where: { isActive: true }, orderBy: { rate: "asc" } }),
    getSettings(),
  ]);

  return (
    <CheckoutForm
      zones={zones.map((z) => ({
        id: z.id,
        name: z.name,
        cities: z.cities,
        rate: toNumber(z.rate),
        etaDays: z.etaDays,
      }))}
      freeShippingThreshold={settings.freeShippingThreshold}
      pickupAddress={settings.address}
    />
  );
}
