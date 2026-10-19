import type { Metadata } from "next";
import { listAdminBanners } from "@/lib/admin/queries";
import { BannerManager } from "@/components/admin/banner-manager";

export const metadata: Metadata = {
  title: "Banners",
  robots: { index: false, follow: false },
};

export default async function AdminBannersPage() {
  const { rows } = await listAdminBanners();
  return <BannerManager rows={rows} />;
}
