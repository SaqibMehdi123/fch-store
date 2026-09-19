import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { TrackOrderView } from "@/components/store/track-order-view";

export const metadata: Metadata = {
  title: "Track Order — Fashion and Collection House",
  description: "Follow your FCH order — status timeline, payment verification and delivery updates.",
};

export default async function TrackOrderPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const order = typeof sp.order === "string" ? sp.order : "";
  const settings = await getSettings();
  return (
    <TrackOrderView
      prefillOrderNo={order}
      settings={{
        bankName: settings.bankName,
        accountTitle: settings.accountTitle,
        iban: settings.iban,
      }}
    />
  );
}
