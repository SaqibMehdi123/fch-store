"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { setOrderStatus } from "@/app/actions/admin";
import { ORDER_TRANSITIONS } from "@/lib/admin/order-machine";
import { ORDER_STATUS_LABELS } from "@/lib/format";

const ACTION_LABELS: Record<string, string> = {
  confirmed: "Confirm & Approve",
  payment_rejected: "Reject Payment",
  processing: "Start Processing",
  shipped: "Mark Shipped",
  delivered: "Mark Delivered",
  cancelled: "Cancel Order",
};

/**
 * Status transition panel for one order — renders only the moves the state
 * machine allows from the current status, plus courier/tracking inputs for
 * shipping. Cancel restores reserved stock (handled server-side).
 */
export function OrderActions({
  orderNo,
  status,
  courierName,
  trackingNumber,
}: {
  orderNo: string;
  status: string;
  courierName: string;
  trackingNumber: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [courier, setCourier] = useState(courierName);
  const [tracking, setTracking] = useState(trackingNumber);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  const moves = ORDER_TRANSITIONS[status] ?? [];

  const go = (next: string) => {
    startTransition(async () => {
      const res = await setOrderStatus({
        orderNo,
        next,
        courierName: courier,
        trackingNumber: tracking,
      });
      if (res.ok) {
        toast.success(res.message);
        setConfirmingCancel(false);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <section className="rounded-sm border border-stone bg-card">
      <h2 className="border-b border-stone px-5 py-4 font-display text-lg">Actions</h2>
      <div className="space-y-3 px-5 py-4">
        {moves.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {status === "delivered"
              ? "This order is complete."
              : status === "payment_rejected"
                ? "Waiting for the customer to re-upload a corrected screenshot."
                : "No transitions available for this status."}
          </p>
        ) : (
          moves.map((next) =>
            next === "cancelled" ? (
              confirmingCancel ? (
                <div key={next} className="rounded-sm border border-destructive/40 bg-destructive/5 p-3">
                  <p className="text-xs text-destructive">
                    Cancelling returns reserved items to stock. This cannot be undone.
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => go("cancelled")}
                      disabled={pending}
                      className="rounded-sm bg-destructive px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                    >
                      Yes, cancel order
                    </button>
                    <button
                      onClick={() => setConfirmingCancel(false)}
                      className="rounded-sm border border-stone px-3 py-1.5 text-xs"
                    >
                      Keep order
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  key={next}
                  onClick={() => setConfirmingCancel(true)}
                  disabled={pending}
                  className="w-full rounded-sm border border-destructive/40 px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                >
                  {ACTION_LABELS[next] ?? next}
                </button>
              )
            ) : next === "shipped" ? (
              <div key={next} className="space-y-2">
                <input
                  value={courier}
                  onChange={(e) => setCourier(e.target.value)}
                  placeholder="Courier (e.g. TCS, Leopards, M&P)"
                  className="w-full rounded-sm border border-stone bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
                />
                <input
                  value={tracking}
                  onChange={(e) => setTracking(e.target.value)}
                  placeholder="Tracking number"
                  className="w-full rounded-sm border border-stone bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
                />
                <button
                  onClick={() => go("shipped")}
                  disabled={pending}
                  className="w-full rounded-sm bg-primary px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {ACTION_LABELS[next] ?? next}
                </button>
              </div>
            ) : (
              <button
                key={next}
                onClick={() => go(next)}
                disabled={pending}
                className="w-full rounded-sm bg-primary px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {ACTION_LABELS[next] ?? next}
              </button>
            )
          )
        )}

        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Allowed next steps follow the order lifecycle. Current status:{" "}
          <span className="text-foreground">{ORDER_STATUS_LABELS[status] ?? status}</span>.
        </p>
      </div>
    </section>
  );
}
