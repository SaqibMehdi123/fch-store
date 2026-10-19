import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getReportsData, resolveRange } from "@/lib/admin/reports";

/**
 * Admin reports API (Phase 5) — sales series, top products, category share,
 * coupon usage, low stock. Session-gated.
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const range = resolveRange({
    from: url.searchParams.get("from"),
    to: url.searchParams.get("to"),
    bucket: url.searchParams.get("bucket"),
  });

  try {
    const data = await getReportsData(range);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Reports query failed" },
      { status: 500 }
    );
  }
}
