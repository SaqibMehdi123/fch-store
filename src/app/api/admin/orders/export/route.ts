import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { resolveRange } from "@/lib/admin/reports";
import { formatDate, toNumber } from "@/lib/format";

/**
 * Orders CSV export (Phase 5) — date-range filtered, Excel-friendly
 * (UTF-8 BOM + CRLF). Session-gated.
 */

function csvCell(value: string | number | null | undefined): string {
  const s = value === null || value === undefined ? "" : String(value);
  // quote when the value contains quotes, commas or newlines
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const { from, to } = resolveRange({ from: url.searchParams.get("from"), to: url.searchParams.get("to") });

  const orders = await db.order.findMany({
    where: { createdAt: { gte: from, lte: to } },
    orderBy: { createdAt: "desc" },
    include: {
      items: { select: { productName: true, quantity: true } },
      coupon: { select: { code: true } },
      payments: { orderBy: { createdAt: "desc" }, take: 1, select: { status: true } },
    },
  });

  const header = [
    "Order No",
    "Date",
    "Status",
    "Customer",
    "Phone",
    "Email",
    "Fulfilment",
    "City",
    "Address",
    "Items",
    "Subtotal (Rs.)",
    "Discount (Rs.)",
    "Shipping (Rs.)",
    "Total (Rs.)",
    "Coupon",
    "Payment Status",
    "Courier",
    "Tracking No",
  ];

  const lines = [header.map(csvCell).join(",")];
  for (const o of orders) {
    lines.push(
      [
        o.orderNo,
        formatDate(o.createdAt),
        o.status,
        o.customerName,
        o.phone,
        o.email,
        o.fulfillment,
        o.city,
        o.address,
        o.items.reduce((n, i) => n + i.quantity, 0),
        toNumber(o.subtotal),
        toNumber(o.discountAmount),
        toNumber(o.shippingFee),
        toNumber(o.total),
        o.coupon?.code ?? "",
        o.payments[0]?.status ?? "",
        o.courierName ?? "",
        o.trackingNumber ?? "",
      ]
        .map(csvCell)
        .join(",")
    );
  }

  const filename = `fch-orders-${from.toISOString().slice(0, 10)}_${to.toISOString().slice(0, 10)}.csv`;
  // \ufeff BOM so Excel detects UTF-8; CRLF per RFC 4180
  const body = "\ufeff" + lines.join("\r\n");

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
