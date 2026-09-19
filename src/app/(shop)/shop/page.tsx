import type { Metadata } from "next";
import { ListingPage } from "@/components/store/listing-page";

export const metadata: Metadata = {
  title: "Shop All — Fashion and Collection House",
  description:
    "Browse the full FCH collection across Women, Men and Kids: kurtas, lawn suits, formals, trousers and more — delivered nationwide.",
};

export default async function ShopPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  return <ListingPage department={null} searchParams={sp} />;
}
