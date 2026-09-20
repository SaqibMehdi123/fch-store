import type { Metadata } from "next";
import { ListingPage } from "@/components/store/listing-page";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Men",
  description:
    "Shop the FCH Men's Edit: kurta shalwar, waistcoats, dress shirts, trousers and jeans. Filter by range, size, colour and price.",
  path: "/men",
  keywords: ["men kurta shalwar", "pakistani men clothing", "men waistcoat", "men trousers Pakistan"],
});

export default async function MenPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  return <ListingPage department="men" searchParams={sp} />;
}
