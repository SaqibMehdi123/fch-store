import type { Metadata } from "next";
import { CmsPage } from "@/components/store/cms-page";

export const metadata: Metadata = {
  title: { absolute: "Terms & Conditions — Fashion and Collection House" },
  description: "Ordering, payment verification, delivery and exchange terms for shopping with FCH.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return <CmsPage slug="terms" />;
}
