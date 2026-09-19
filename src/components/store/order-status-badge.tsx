import { cn } from "@/lib/utils";

const STYLES: Record<string, string> = {
  awaiting_payment: "border-gold/40 bg-gold/10 text-gold",
  payment_submitted: "border-blue-200 bg-blue-50 text-blue-700",
  confirmed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  processing: "border-emerald-200 bg-emerald-50 text-emerald-700",
  shipped: "border-emerald-200 bg-emerald-50 text-emerald-700",
  delivered: "border-emerald-300 bg-emerald-100 text-emerald-800",
  payment_rejected: "border-destructive/40 bg-destructive/10 text-destructive",
  cancelled: "border-destructive/40 bg-destructive/10 text-destructive",
  expired: "border-stone bg-stone/60 text-muted-foreground",
};

const LABELS: Record<string, string> = {
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

/** Compact status chip used on the order page, track-order timeline and admin. */
export function OrderStatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em]",
        STYLES[status] ?? "border-stone bg-stone/60 text-muted-foreground",
        className
      )}
    >
      {LABELS[status] ?? status}
    </span>
  );
}
