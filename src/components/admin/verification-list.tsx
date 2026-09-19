"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Eye, X } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { verifyPayment } from "@/app/actions/admin";
import { formatPKR, formatDateTime } from "@/lib/format";

const decisionPlaceholder = "Internal note — required when rejecting (e.g. amount mismatch, ref not found)";


type QueueItem = {
  id: string;
  amount: number;
  screenshotUrl: string | null;
  transactionRef: string | null;
  senderName: string | null;
  createdAt: Date;
  orderNo: string;
  customerName: string;
  phone: string;
  email: string;
  orderTotal: number;
};

function ScreenshotViewer({ url, alt }: { url: string; alt: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-1.5 text-xs text-gold transition-colors hover:opacity-80">
          <Eye className="h-3.5 w-3.5" /> View screenshot
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">{alt}</DialogTitle>
        </DialogHeader>
        <img src={url} alt={alt} className="max-h-[70vh] w-full rounded-sm object-contain" />
      </DialogContent>
    </Dialog>
  );
}

function DecisionRow({ item }: { item: QueueItem }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  const decide = (decision: "approve" | "reject") => {
    if (decision === "reject" && !note.trim()) {
      toast.error("Add a short reason so the customer can fix the transfer.");
      return;
    }
    startTransition(async () => {
      const res = await verifyPayment({ paymentId: item.id, decision, adminNote: note || undefined });
      if (res.ok) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <li className="rounded-sm border border-stone bg-card">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-stone px-5 py-4">
        <div>
          <p className="text-sm font-medium">
            {item.orderNo} · {item.customerName}
          </p>
          <p className="text-xs text-muted-foreground">
            {item.phone} · {item.email} · submitted {formatDateTime(item.createdAt)}
          </p>
        </div>
        <div className="text-right">
          <p className="font-display text-lg">{formatPKR(item.amount)}</p>
          <p className="text-[11px] text-muted-foreground">order total {formatPKR(item.orderTotal)}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-xs text-muted-foreground">
        <span>
          Sender: <span className="text-foreground">{item.senderName ?? "—"}</span> · Ref:{" "}
          <span className="text-foreground">{item.transactionRef ?? "—"}</span>
        </span>
        {item.screenshotUrl ? (
          <ScreenshotViewer url={item.screenshotUrl} alt={`Payment proof ${item.orderNo}`} />
        ) : (
          <span className="text-destructive">no screenshot</span>
        )}
      </div>
      <div className="flex flex-col gap-2 border-t border-stone px-5 py-4 sm:flex-row sm:items-center">
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={1}
          placeholder={decisionPlaceholder}
          className="min-h-9 flex-1 text-sm"
        />
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => decide("approve")}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-sm bg-emerald-700 px-4 py-2 text-xs font-medium uppercase tracking-wide text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Check className="h-3.5 w-3.5" /> Approve
          </button>
          <button
            onClick={() => decide("reject")}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-sm border border-destructive/40 px-4 py-2 text-xs font-medium uppercase tracking-wide text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
          >
            <X className="h-3.5 w-3.5" /> Reject
          </button>
        </div>
      </div>
    </li>
  );
}

export function VerificationList({ items }: { items: QueueItem[] }) {
  return (
    <ul className="mt-3 space-y-4">
      {items.map((item) => (
        <DecisionRow key={item.id} item={item} />
      ))}
    </ul>
  );
}
