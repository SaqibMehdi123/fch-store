import { cache } from "react";
import { db } from "@/lib/db";

/**
 * Site settings — key/value store surfaced as a typed object.
 * Values reflect live admin changes (Admin → Settings, Phase 4).
 */
export type SiteSettings = {
  bankName: string;
  accountTitle: string;
  iban: string;
  whatsappNumber: string;
  phone: string;
  email: string;
  address: string;
  instagramUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
  announcementText: string;
  announcementEnabled: boolean;
  freeShippingThreshold: number;
  paymentUploadDeadlineHours: number;
  paymentApprovalDeadlineHours: number;
};

const DEFAULTS: SiteSettings = {
  bankName: "",
  accountTitle: "FASHION AND COLLECTION HOUSE",
  iban: "",
  whatsappNumber: "",
  phone: "",
  email: "orders@fch.pk",
  address: "",
  instagramUrl: "",
  facebookUrl: "",
  tiktokUrl: "",
  announcementText: "",
  announcementEnabled: false,
  freeShippingThreshold: 5000,
  paymentUploadDeadlineHours: 24,
  paymentApprovalDeadlineHours: 48,
};

export const getSettings = cache(async (): Promise<SiteSettings> => {
  try {
    const rows = await db.setting.findMany({ select: { key: true, value: true } });
    const map = new Map(rows.map((r) => [r.key, r.value]));
    return {
      bankName: map.get("bank_name") ?? DEFAULTS.bankName,
      accountTitle: map.get("account_title") ?? DEFAULTS.accountTitle,
      iban: map.get("iban") ?? DEFAULTS.iban,
      whatsappNumber: map.get("whatsapp_number") ?? DEFAULTS.whatsappNumber,
      phone: map.get("phone") ?? DEFAULTS.phone,
      email: map.get("email") ?? DEFAULTS.email,
      address: map.get("address") ?? DEFAULTS.address,
      instagramUrl: map.get("instagram_url") ?? DEFAULTS.instagramUrl,
      facebookUrl: map.get("facebook_url") ?? DEFAULTS.facebookUrl,
      tiktokUrl: map.get("tiktok_url") ?? DEFAULTS.tiktokUrl,
      announcementText: map.get("announcement_text") ?? DEFAULTS.announcementText,
      announcementEnabled: (map.get("announcement_enabled") ?? "false") === "true",
      freeShippingThreshold: Number(map.get("free_shipping_threshold") ?? DEFAULTS.freeShippingThreshold),
      paymentUploadDeadlineHours: Number(map.get("payment_upload_deadline_hours") ?? DEFAULTS.paymentUploadDeadlineHours),
      paymentApprovalDeadlineHours: Number(map.get("payment_approval_deadline_hours") ?? DEFAULTS.paymentApprovalDeadlineHours),
    };
  } catch {
    // DB not reachable/migrated yet — layout shell must still render
    return DEFAULTS;
  }
});

