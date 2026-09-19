import type { Metadata } from "next";
import { listAdminReviews } from "@/lib/admin/queries";
import { ReviewList } from "@/components/admin/review-list";

export const metadata: Metadata = {
  title: "Reviews",
  robots: { index: false, follow: false },
};

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const status = ["pending", "approved", "rejected"].includes(sp.status ?? "") ? sp.status! : "pending";
  const { rows, pendingCount, approvedCount, rejectedCount } = await listAdminReviews({ status });

  return (
    <ReviewList
      rows={rows}
      status={status}
      counts={{ pending: pendingCount, approved: approvedCount, rejected: rejectedCount }}
    />
  );
}
