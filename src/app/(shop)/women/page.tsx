import type { Metadata } from "next";
import { ListingPage } from "@/components/store/listing-page";

export const metadata: Metadata = {
  title: "Women — Fashion and Collection House",
  description:
    "Shop the FCH Women's Edit: pret, unstitched lawn, formals and luxury pret. Filter by range, size, colour and price — delivered nationwide.",
};

export default async function WomenPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  return <ListingPage department="women" searchParams={sp} />;
}
