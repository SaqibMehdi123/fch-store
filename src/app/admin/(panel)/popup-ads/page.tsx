import type { Metadata } from "next";
import { listAdminPopupAds } from "@/lib/admin/queries";
import { PopupAdManager } from "@/components/admin/popup-ad-manager";

export const metadata: Metadata = {
  title: "Homepage Popup",
  robots: { index: false, follow: false },
};

export default async function AdminPopupAdsPage() {
  const { rows } = await listAdminPopupAds();
  return <PopupAdManager rows={rows} />;
}
