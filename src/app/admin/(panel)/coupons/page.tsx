import type { Metadata } from "next";
import { listAdminCoupons } from "@/lib/admin/queries";
import { CouponManager } from "@/components/admin/coupon-manager";

export const metadata: Metadata = {
  title: "Coupons",
  robots: { index: false, follow: false },
};

export default async function AdminCouponsPage() {
  const { rows } = await listAdminCoupons();
  return <CouponManager rows={rows} />;
}
