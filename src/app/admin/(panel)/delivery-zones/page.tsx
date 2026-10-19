import type { Metadata } from "next";
import { listAdminZones } from "@/lib/admin/queries";
import { ZoneManager } from "@/components/admin/zone-manager";

export const metadata: Metadata = {
  title: "Delivery Zones",
  robots: { index: false, follow: false },
};

export default async function AdminZonesPage() {
  const { rows } = await listAdminZones();
  return <ZoneManager rows={rows} />;
}
