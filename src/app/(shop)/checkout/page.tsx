import type { Metadata } from "next";
import { CloudOff } from "lucide-react";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { toNumber } from "@/lib/format";
import { CheckoutForm } from "@/components/store/checkout-form";

export const dynamic = "force-dynamic"; // DB-backed (zones + settings) — never prerender at build time

export const metadata: Metadata = {
  title: { absolute: "Checkout — Fashion and Collection House" },
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  // Delivery zones are the only hard DB dependency here (getSettings fails
  // soft internally). If the DB is unreachable, render a graceful notice
  // instead of a 500 — placing an order needs the DB anyway.
  let dbDown = false;
  let zones: Awaited<ReturnType<typeof db.deliveryZone.findMany>> = [];
  try {
    zones = await db.deliveryZone.findMany({ where: { isActive: true }, orderBy: { rate: "asc" } });
  } catch (err) {
    console.error("[checkout] delivery zones unavailable — rendering degraded checkout:", err);
    dbDown = true;
  }
  const settings = await getSettings();

  if (dbDown) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 lg:py-24">
        <div className="flex flex-col items-center rounded-sm border border-stone bg-card px-6 py-16 text-center">
          <CloudOff className="h-8 w-8 text-gold" strokeWidth={1.5} />
          <h1 className="mt-4 font-display text-3xl">Checkout is briefly unavailable</h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            We&apos;re restoring our store services — your cart is saved on this device. Please try
            again in a few minutes, or reach us on WhatsApp and we&apos;ll take your order manually.
          </p>
        </div>
      </div>
    );
  }

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
