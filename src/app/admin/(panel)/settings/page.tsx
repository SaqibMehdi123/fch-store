import type { Metadata } from "next";
import { db } from "@/lib/db";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

export default async function AdminSettingsPage() {
  const rows = await db.setting.findMany({ select: { key: true, value: true } });
  const map = new Map(rows.map((r) => [r.key, r.value]));

  return (
    <SettingsForm
      initial={{
        bank_name: map.get("bank_name") ?? "",
        account_title: map.get("account_title") ?? "FASHION AND COLLECTION HOUSE",
        iban: map.get("iban") ?? "",
        whatsapp_number: map.get("whatsapp_number") ?? "",
        phone: map.get("phone") ?? "",
        email: map.get("email") ?? "",
        address: map.get("address") ?? "",
        instagram_url: map.get("instagram_url") ?? "",
        facebook_url: map.get("facebook_url") ?? "",
        tiktok_url: map.get("tiktok_url") ?? "",
        announcement_text: map.get("announcement_text") ?? "",
        announcement_enabled: map.get("announcement_enabled") === "true",
        free_shipping_threshold: map.get("free_shipping_threshold") ?? "5000",
        payment_upload_deadline_hours: map.get("payment_upload_deadline_hours") ?? "24",
        payment_approval_deadline_hours: map.get("payment_approval_deadline_hours") ?? "48",
      }}
    />
  );
}
