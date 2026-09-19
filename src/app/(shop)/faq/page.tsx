import type { Metadata } from "next";
import { CmsPage } from "@/components/store/cms-page";

export const metadata: Metadata = {
  title: "FAQ — Fashion and Collection House",
  description:
    "How to order, how to pay, delivery times, exchanges and payment verification — answers to the most common FCH questions.",
};

export default function FaqPage() {
  return <CmsPage slug="faq" />;
}
