"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { retryEmail } from "@/app/actions/admin-content";
import { formatDateTime } from "@/lib/format";
import type { AdminEmailRow } from "@/lib/admin/queries";

const STATUS_STYLES: Record<AdminEmailRow["status"], string> = {
  queued: "bg-amber-100 text-amber-800 border-amber-200",
  sent: "bg-emerald-50 text-emerald-700 border-emerald-200",
  failed: "bg-red-50 text-red-700 border-red-200",
};

const TEMPLATE_LABELS: Record<string, string> = {
  order_placed: "Order placed + payment instructions",
  payment_submitted: "Payment under review",
  order_confirmed: "Payment confirmed",
  order_processing: "Being prepared",
  payment_rejected: "Payment rejected + re-upload",
  order_shipped: "Shipped + tracking",
  order_delivered: "Delivered",
  order_cancelled: "Cancelled",
  order_expired: "Expired",
  admin_new_order: "Admin: new order",
  admin_payment_uploaded: "Admin: screenshot uploaded",
  contact_received: "Contact form notification",
};

function templateLabel(t: string) {
  return TEMPLATE_LABELS[t] ?? t;
}

function EmailPreview({ row }: { row: AdminEmailRow }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2 text-xs">
          <Eye className="h-3.5 w-3.5" /> Preview
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-display">{row.subject ?? templateLabel(row.template)}</DialogTitle>
          <DialogDescription>
            To {row.to} · {formatDateTime(row.createdAt)} · {row.transport}
          </DialogDescription>
        </DialogHeader>
        {row.html ? (
          <iframe
            title={`Email preview — ${row.subject ?? row.template}`}
            srcDoc={row.html}
            sandbox=""
            className="h-[65vh] w-full rounded-sm border border-stone bg-white"
          />
        ) : (
          <div className="rounded-sm border border-dashed border-stone bg-card px-5 py-10 text-center text-sm text-muted-foreground">
            No rendered copy stored for this row (queued before Phase 5). It will render on the next send.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function EmailLogTable({ items }: { items: AdminEmailRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  const retry = (id: string) => {
    setBusyId(id);
    startTransition(async () => {
      const res = await retryEmail(id);
      toast[res.ok ? "success" : "error"](res.ok ? (res.message ?? "Email sent.") : res.message);
      setBusyId(null);
      if (res.ok) router.refresh();
    });
  };

  if (items.length === 0) {
    return (
      <div className="rounded-sm border border-stone bg-card px-5 py-10 text-center text-sm text-muted-foreground">
        No emails match this filter yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-sm border border-stone bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-stone bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-2.5 font-medium">Status</th>
            <th className="px-4 py-2.5 font-medium">Template</th>
            <th className="px-4 py-2.5 font-medium">To</th>
            <th className="px-4 py-2.5 font-medium">Order</th>
            <th className="px-4 py-2.5 font-medium">Sent at</th>
            <th className="px-4 py-2.5 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone">
          {items.map((row) => (
            <tr key={row.id} className="align-middle">
              <td className="px-4 py-2.5">
                <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${STATUS_STYLES[row.status]}`}>
                  {row.status}
                </span>
                {row.error && (
                  <div className="mt-1 max-w-56 truncate text-[11px] text-muted-foreground" title={row.error}>
                    {row.error}
                  </div>
                )}
              </td>
              <td className="px-4 py-2.5">
                <div>{templateLabel(row.template)}</div>
                <div className="text-[11px] text-muted-foreground">{row.template}</div>
              </td>
              <td className="px-4 py-2.5 text-muted-foreground">{row.to}</td>
              <td className="px-4 py-2.5">
                {row.orderNo ? (
                  <a href={`/admin/orders/${row.orderNo}`} className="text-gold underline-offset-2 hover:underline">
                    {row.orderNo}
                  </a>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
              <td className="px-4 py-2.5 text-muted-foreground">{formatDateTime(row.createdAt)}</td>
              <td className="px-4 py-2.5">
                <div className="flex items-center justify-end gap-1">
                  <EmailPreview row={row} />
                  {row.status !== "sent" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5 px-2 text-xs"
                      disabled={pending && busyId === row.id}
                      onClick={() => retry(row.id)}
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${pending && busyId === row.id ? "animate-spin" : ""}`} />
                      Retry
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
