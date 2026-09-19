/**
 * FCH currency & date formatters.
 * Currency: PKR — "Rs. 4,999" (comma separators, Rs. prefix, tax-inclusive prices).
 * Dates: DD/MM/YYYY. Site language: English.
 */

type MoneyInput = number | string | { toNumber: () => number } | null | undefined;

/** Coerce Prisma Decimal | string | number → number */
export function toNumber(value: MoneyInput): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") return parseFloat(value) || 0;
  if (typeof value === "object" && typeof value.toNumber === "function") return value.toNumber();
  return Number(value) || 0;
}

/** "Rs. 4,999" — standard 3-digit comma grouping */
export function formatPKR(amount: MoneyInput): string {
  const n = toNumber(amount);
  const formatted = n.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: n % 1 === 0 ? 0 : 2,
  });
  return `Rs. ${formatted}`;
}

/** DD/MM/YYYY */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/** DD/MM/YYYY HH:mm (24h) */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${formatDate(d)} ${hh}:${mi}`;
}

/** Discount percentage between original and sale price, e.g. 17 */
export function discountPercent(price: MoneyInput, salePrice: MoneyInput): number | null {
  const p = toNumber(price);
  const s = toNumber(salePrice);
  if (!p || !s || s >= p) return null;
  return Math.round(((p - s) / p) * 100);
}

/** Effective price (sale price if present, otherwise price) */
export function effectivePrice(price: MoneyInput, salePrice: MoneyInput): number {
  const p = toNumber(price);
  const s = toNumber(salePrice);
  return s && s > 0 && s < p ? s : p;
}

/** Human-friendly order status label */
export const ORDER_STATUS_LABELS: Record<string, string> = {
  awaiting_payment: "Awaiting Payment",
  payment_submitted: "Payment Under Review",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  payment_rejected: "Payment Rejected",
  cancelled: "Cancelled",
  expired: "Expired",
};
