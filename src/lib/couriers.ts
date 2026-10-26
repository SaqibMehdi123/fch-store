/**
 * Courier registry — the shipping companies FCH ships with, their public
 * tracking deep-links, and which ones have a live API adapter.
 *
 * Live status pulls need merchant API credentials (Settings → Courier
 * integrations). Without them the order page falls back to a one-click
 * deep link to the courier's own tracking page — same place the admin
 * used to visit manually.
 */

export type CourierId =
  | "tcs"
  | "leopards"
  | "mp"
  | "trax"
  | "postex"
  | "callcourier"
  | "swyft"
  | "other";

export type Courier = {
  id: CourierId;
  name: string;
  /** Public tracking deep-link builder (admin fallback + customer links). */
  trackingUrl: (trackingNumber: string) => string;
  /** Which live adapter to use when credentials are configured. */
  api: "leopards" | "postex" | null;
  /** Tracking-number input hint shown in the admin form. */
  hint: string;
};

export const COURIERS: Courier[] = [
  {
    id: "tcs",
    name: "TCS",
    trackingUrl: (tn) => `https://www.tcscouriers.com/pk/tracking/?trackNum=${encodeURIComponent(tn)}`,
    api: null,
    hint: "e.g. 8 digit consignment number",
  },
  {
    id: "leopards",
    name: "Leopards Courier",
    trackingUrl: (tn) => `https://www.leopardscourier.com/track-your-shipment?cn=${encodeURIComponent(tn)}`,
    api: "leopards",
    hint: "Leopards CN / tracking number",
  },
  {
    id: "mp",
    name: "M&P (Muller & Phipps)",
    trackingUrl: (tn) => `https://www.mulphico.pk/tracking/?track=${encodeURIComponent(tn)}`,
    api: null,
    hint: "M&P consignment number",
  },
  {
    id: "trax",
    name: "Trax",
    trackingUrl: (tn) => `https://trax.pk/tracking/?track=${encodeURIComponent(tn)}`,
    api: null,
    hint: "Trax booking number",
  },
  {
    id: "postex",
    name: "PostEx",
    trackingUrl: (tn) => `https://postex.pk/tracking/?tracking_number=${encodeURIComponent(tn)}`,
    api: "postex",
    hint: "PostEx tracking number",
  },
  {
    id: "callcourier",
    name: "CallCourier",
    trackingUrl: (tn) => `https://callcourier.com.pk/tracking/?cn=${encodeURIComponent(tn)}`,
    api: null,
    hint: "CallCourier CN number",
  },
  {
    id: "swyft",
    name: "Swyft",
    trackingUrl: (tn) => `https://swyft.pk/track/?cn=${encodeURIComponent(tn)}`,
    api: null,
    hint: "Swyft consignment number",
  },
  {
    id: "other",
    name: "Other / local rider",
    trackingUrl: () => "",
    api: null,
    hint: "Any reference the rider shared",
  },
];

export function getCourier(id: string | null | undefined): Courier | undefined {
  return COURIERS.find((c) => c.id === id);
}

export function courierName(id: string | null | undefined): string {
  return getCourier(id)?.name ?? "";
}
