import type { Metadata } from "next";
import { ListingPage } from "@/components/store/listing-page";

export const metadata: Metadata = {
  title: "Kids — Fashion and Collection House",
  description:
    "Shop the FCH Kids' Edit: comfortable, playful essentials for boys and girls in breathable fabrics. Filter by range, size and colour.",
};

export default async function KidsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  return <ListingPage department="kids" searchParams={sp} />;
}
