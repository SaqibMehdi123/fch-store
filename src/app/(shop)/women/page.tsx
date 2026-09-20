import type { Metadata } from "next";
import { ListingPage } from "@/components/store/listing-page";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Women",
  description:
    "Shop the FCH Women's Edit: pret, unstitched lawn, formals and luxury pret. Filter by range, size, colour and price — delivered nationwide.",
  path: "/women",
  keywords: ["women lawn suits", "pakistani women clothing", "luxury pret women", "unstitched lawn", "women formals Pakistan"],
});

export default async function WomenPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  return <ListingPage department="women" searchParams={sp} />;
}
