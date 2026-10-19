"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Check, Star, X } from "lucide-react";
import { moderateReview } from "@/app/actions/admin-content";
import type { AdminReviewRow } from "@/lib/admin/queries";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
] as const;

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn("h-3.5 w-3.5", n <= rating ? "fill-gold text-gold" : "text-stone")}
        />
      ))}
    </span>
  );
}

export function ReviewList({
  rows,
  counts,
  status,
}: {
  rows: AdminReviewRow[];
  counts: { pending: number; approved: number; rejected: number };
  status: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  const decide = (id: string, decision: "approve" | "reject") => {
    setBusyId(id);
    startTransition(async () => {
      const res = await moderateReview({ id, decision });
      if (res.ok) toast.success(res.message ?? "Done."); else toast.error(res.message);
      setBusyId(null);
      router.refresh();
    });
  };

  return (
    <div className="animate-fade-in">
      <p className="label-caps text-gold">Marketing</p>
      <h1 className="mt-1 font-display text-3xl">Reviews</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Approved reviews appear on the product page instantly.
      </p>

      <nav aria-label="Review status filter" className="mt-5 flex gap-1.5">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/reviews?status=${t.key}`}
            aria-current={status === t.key ? "true" : undefined}
            className={cn(
              "rounded-sm border px-3 py-1.5 text-[11px] uppercase tracking-wide transition-colors",
              status === t.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-stone bg-card text-muted-foreground hover:border-gold hover:text-gold",
            )}
          >
            {t.label} ({counts[t.key]})
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <div className="mt-6 rounded-sm border border-stone bg-card px-6 py-14 text-center text-sm text-muted-foreground">
          No {status} reviews right now.
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {rows.map((r) => (
            <li key={r.id} className="rounded-sm border border-stone bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <Stars rating={r.rating} />
                    {r.title && <p className="font-display text-lg leading-none">{r.title}</p>}
                    {r.isVerifiedPurchase && (
                      <span className="rounded-sm bg-secondary px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gold">
                        Verified purchase
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/90">{r.body}</p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {r.name} · {r.email} · {formatDate(r.createdAt)} · on{" "}
                    <Link href={`/product/${r.productSlug}`} target="_blank" className="text-gold hover:underline">
                      {r.productName}
                    </Link>
                  </p>
                </div>

                {r.status === "pending" && (
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => decide(r.id, "approve")}
                      disabled={pending && busyId === r.id}
                      className="inline-flex items-center gap-1.5 rounded-sm bg-primary px-3.5 py-2 text-[11px] font-medium uppercase tracking-wide text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      <Check className="h-3.5 w-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => decide(r.id, "reject")}
                      disabled={pending && busyId === r.id}
                      className="inline-flex items-center gap-1.5 rounded-sm border border-destructive/40 px-3.5 py-2 text-[11px] font-medium uppercase tracking-wide text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                    >
                      <X className="h-3.5 w-3.5" /> Reject
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
