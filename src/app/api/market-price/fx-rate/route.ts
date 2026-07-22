export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCached, TTL } from "@/lib/cache";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await getCached("market-price:fx-rate", async () => {
    // Look for mgoUsd and usdIdr in latest price entry
    // These were added via ALTER TABLE in EXEC-033 G-01/G-02
    const latest = await prisma.$queryRaw<{ mgoUsd: number | null; usdIdr: number | null; date: Date | null }[]>`
      SELECT "mgoUsd", "fxRateIdr" AS "usdIdr", "date"
      FROM market_prices
      WHERE "mgoUsd" IS NOT NULL OR "fxRateIdr" IS NOT NULL
      ORDER BY "date" DESC, "createdAt" DESC
      LIMIT 1
    `;
    if (!latest.length) return { mgoUsd: null, usdIdr: null, date: null };
    return {
      mgoUsd: latest[0].mgoUsd ? Number(latest[0].mgoUsd) : null,
      usdIdr: latest[0].usdIdr ? Number(latest[0].usdIdr) : null,
      date:   latest[0].date?.toISOString() ?? null,
    };
  }, TTL.MARKET_PRICE ?? 300);

  return NextResponse.json({ data });
}

