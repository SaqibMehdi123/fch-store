import type { Metadata } from "next";
import { CmsPage } from "@/components/store/cms-page";

export const metadata: Metadata = {
  title: { absolute: "About Us — Fashion and Collection House" },
  description:
    "Fashion and Collection House (FCH) is a premium Pakistani clothing brand delivering nationwide — fabrics that feel exceptional, fits that flatter.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About Us — Fashion and Collection House",
    description:
      "Fashion and Collection House (FCH) is a premium Pakistani clothing brand delivering nationwide — fabrics that feel exceptional, fits that flatter.",
    url: "/about",
    type: "website",
    siteName: "Fashion and Collection House",
    locale: "en-PK",
  },
};

export default function AboutPage() {
  return <CmsPage slug="about" />;
}
