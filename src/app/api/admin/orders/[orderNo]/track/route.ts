import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCourier } from "@/lib/couriers";
import { fetchTracking } from "@/lib/tracking";

/**
 * Save + pull delivery tracking for one order.
 *
 * The admin picks a courier and enters the tracking number; the courier's
 * API (when credentials exist in Settings → Courier integrations) returns
 * the live shipment status, which is normalised and cached on the order row
 * so the order page — and everyone after — sees the latest state inline.
 * When no API is available the response carries a deep link to the
 * courier's own tracking page instead. Never throws.
 */
export async function POST(request: Request, { params }: { params: Promise<{ orderNo: string }> }) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderNo } = await params;
  let body: { courierId?: string; trackingNumber?: string };
  try {
    body = (await request.json()) as { courierId?: string; trackingNumber?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const courier = getCourier(body.courierId ?? "");
  const trackingNumber = (body.trackingNumber ?? "").trim();
  if (!courier) return NextResponse.json({ error: "Pick a courier from the list." }, { status: 400 });
  if (!trackingNumber) return NextResponse.json({ error: "Enter the tracking number." }, { status: 400 });

  const order = await db.order.findUnique({
    where: { orderNo },
    select: { id: true },
  });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  // courier API credentials from the settings key/value store
  const settingRows = await db.setting.findMany({
    where: { key: { in: ["courier_leopards_api_key", "courier_leopards_api_password", "courier_postex_api_token"] } },
    select: { key: true, value: true },
  });
  const s = new Map(settingRows.map((r) => [r.key, r.value]));

  const result = await fetchTracking(courier.id, trackingNumber, {
    leopardsApiKey: s.get("courier_leopards_api_key") ?? "",
    leopardsApiPassword: s.get("courier_leopards_api_password") ?? "",
    postexApiToken: s.get("courier_postex_api_token") ?? "",
  });

  await db.order.update({
    where: { id: order.id },
    data: {
      courierName: courier.name,
      trackingNumber,
      trackingStatus: result.status,
      ...(result.events.length ? { trackingEvents: result.events } : {}),
      trackingCheckedAt: new Date(),
    },
  });

  revalidatePath(`/admin/orders/${orderNo}`);
  revalidatePath("/admin/orders");

  return NextResponse.json({
    live: result.live,
    status: result.status,
    events: result.events,
    message: result.message ?? null,
    url: courier.trackingUrl(trackingNumber) || null,
    courierName: courier.name,
  });
}
