export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCached, TTL } from "@/lib/cache";
import { getLastKnownMarketPrices } from "@/lib/market-price-last-known";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await getCached("market-price:fx-rate", async () => {
    const { latest: knownMgo, previous: knownFx } = await getLastKnownMarketPrices(["mgoUsd", "usdIdr"] as const);
    const latestDate = [knownMgo.mgoUsd, knownMgo.usdIdr]
      .filter((value): value is NonNullable<typeof value> => value != null)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

    return {
      mgoUsd: knownMgo.mgoUsd ? Number(knownMgo.mgoUsd.value) : null,
      usdIdr: knownMgo.usdIdr ? Number(knownMgo.usdIdr.value) : null,
      date: latestDate?.date.toISOString() ?? null,
      updatedAt: latestDate?.createdAt.toISOString() ?? null,
      previous: {
        mgoUsd: knownFx.mgoUsd ? Number(knownFx.mgoUsd.value) : null,
        usdIdr: knownFx.usdIdr ? Number(knownFx.usdIdr.value) : null,
      },
    };
  }, TTL.MARKET_PRICE ?? 300);

  return NextResponse.json({ data });
}

