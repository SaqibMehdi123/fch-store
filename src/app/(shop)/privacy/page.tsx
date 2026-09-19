import type { Metadata } from "next";
import { CmsPage } from "@/components/store/cms-page";

export const metadata: Metadata = {
  title: "Privacy Policy — Fashion and Collection House",
  description: "What information FCH collects, how it is used, and your rights over your data.",
};

export default function PrivacyPage() {
  return <CmsPage slug="privacy" />;
}
