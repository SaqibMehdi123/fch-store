import type { Metadata } from "next";
import { CmsPage } from "@/components/store/cms-page";

export const revalidate = 300; // ISR — DB-backed CMS page, refreshed every 5 minutes

export const metadata: Metadata = {
  title: { absolute: "Privacy Policy — Fashion and Collection House" },
  description: "What information FCH collects, how it is used, and your rights over your data.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return <CmsPage slug="privacy" />;
}
