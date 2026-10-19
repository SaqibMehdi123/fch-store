import type { Metadata } from "next";
import { listRecentDecisions, listVerificationQueue } from "@/lib/admin/queries";
import { formatPKR, formatDateTime } from "@/lib/format";
import { VerificationList } from "@/components/admin/verification-list";

export const metadata: Metadata = {
  title: "Payment Verification",
  robots: { index: false, follow: false },
};

/**
 * Payment Verification — screenshots submitted by customers against their
 * orders. Approve → order confirmed; Reject → order returns to the customer
 * (payment_rejected) so they can upload a corrected screenshot.
 */
export default async function VerificationPage() {
  const [queue, decisions] = await Promise.all([listVerificationQueue(), listRecentDecisions()]);

  return (
    <div className="animate-fade-in">
      <p className="label-caps text-gold">Overview</p>
      <h1 className="mt-1 font-display text-3xl">Payment Verification</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Compare each screenshot against the bank statement before approving. The exact amount, the
        transfer reference and the sender name are shown for every submission.
      </p>

      <section className="mt-6">
        <h2 className="font-display text-lg">
          Queue <span className="text-sm text-muted-foreground">({queue.length})</span>
        </h2>
        {queue.length === 0 ? (
          <div className="mt-4 rounded-sm border border-stone bg-card px-5 py-10 text-center text-sm text-muted-foreground">
            No payments are waiting for review.
          </div>
        ) : (
          <VerificationList items={queue} />
        )}
      </section>

      {decisions.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-lg">Recent decisions</h2>
          <ul className="mt-3 divide-y divide-stone rounded-sm border border-stone bg-card">
            {decisions.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                <span>
                  <span className="font-medium">{d.orderNo}</span> · {d.customerName}
                </span>
                <span className="flex items-center gap-3 text-xs text-muted-foreground">
                  {d.adminNote && <span className="max-w-64 truncate italic">“{d.adminNote}”</span>}
                  <span
                    className={d.status === "approved" ? "font-medium text-emerald-700" : "font-medium text-destructive"}
                  >
                    {d.status === "approved" ? "APPROVED" : "REJECTED"}
                  </span>
                  <span>{formatDateTime(d.updatedAt)}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-8 text-xs text-muted-foreground">
        Amounts shown in PKR. Queue ordering is oldest first so no customer waits unnoticed.
        {queue.length > 0 && ` Oldest submission: ${formatDateTime(queue[0].createdAt)} (${formatPKR(queue[0].amount)}).`}
      </p>
    </div>
  );
}
