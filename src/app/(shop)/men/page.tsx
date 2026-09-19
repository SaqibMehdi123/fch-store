import type { Metadata } from "next";
import { ListingPage } from "@/components/store/listing-page";

export const metadata: Metadata = {
  title: "Men — Fashion and Collection House",
  description:
    "Shop the FCH Men's Edit: kurta shalwar, waistcoats, dress shirts, trousers and jeans. Filter by range, size, colour and price.",
};

export default async function MenPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  return <ListingPage department="men" searchParams={sp} />;
}
