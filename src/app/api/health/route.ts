import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Health probe for uptime monitors (UptimeRobot, BetterStack, Vercel checks).
 * Verifies the process AND the database round-trip — a 200 here means the
 * store can actually serve data, not just that the server is listening.
 * Returns 503 so monitors can alert on DB outages.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      db: "up",
      time: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { status: "degraded", db: "down", time: new Date().toISOString() },
      { status: 503 },
    );
  }
}
