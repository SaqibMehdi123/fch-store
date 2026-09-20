import type { Metadata } from "next";
import { ListingPage } from "@/components/store/listing-page";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Kids",
  description:
    "Shop the FCH Kids' Edit: comfortable, playful essentials for boys and girls in breathable fabrics. Filter by range, size and colour.",
  path: "/kids",
  keywords: ["kids kurta", "pakistani kids clothing", "boys kurta set", "girls eastern wear"],
});

export default async function KidsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  return <ListingPage department="kids" searchParams={sp} />;
}
