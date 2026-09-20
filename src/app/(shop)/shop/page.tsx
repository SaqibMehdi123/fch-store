import type { Metadata } from "next";
import { ListingPage } from "@/components/store/listing-page";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Shop All",
  description:
    "Browse the full FCH collection across Women, Men and Kids: kurtas, lawn suits, formals, trousers and more — delivered nationwide.",
  path: "/shop",
  keywords: ["pakistani clothing online", "shop kurtas Pakistan", "lawn suits", "luxury pret", "FCH collection"],
});

export default async function ShopPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  return <ListingPage department={null} searchParams={sp} />;
}
