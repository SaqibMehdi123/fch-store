import type { Metadata } from "next";
import { CmsPage } from "@/components/store/cms-page";

export const metadata: Metadata = {
  title: "Terms & Conditions — Fashion and Collection House",
  description: "Ordering, payment verification, delivery and exchange terms for shopping with FCH.",
};

export default function TermsPage() {
  return <CmsPage slug="terms" />;
}
