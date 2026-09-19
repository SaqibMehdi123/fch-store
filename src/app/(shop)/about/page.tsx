import type { Metadata } from "next";
import { CmsPage } from "@/components/store/cms-page";

export const metadata: Metadata = {
  title: "About Us — Fashion and Collection House",
  description:
    "Fashion and Collection House (FCH) is a premium Pakistani clothing brand delivering nationwide — fabrics that feel exceptional, fits that flatter.",
};

export default function AboutPage() {
  return <CmsPage slug="about" />;
}
