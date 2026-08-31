export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCached, TTL } from "@/lib/cache";
import { getLastKnownMarketPrices, MARKET_PRICE_FIELDS } from "@/lib/market-price-last-known";

function serialise(row: Record<string, unknown> | null) {
  if (!row) return null;
  const out = { ...row };
  for (const f of MARKET_PRICE_FIELDS) { if (out[f] != null) out[f] = Number(out[f]); }
  return out;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await getCached(
    "market-price:latest",
    async () => {
      const [absoluteLatest, known] = await Promise.all([
        prisma.marketPrice.findFirst({
          orderBy: { createdAt: "desc" },
          select: {
            id: true, date: true, source: true, action: true, notes: true, createdAt: true,
            user: { select: { name: true } },
          },
        }),
        getLastKnownMarketPrices(MARKET_PRICE_FIELDS),
      ]);

      if (!absoluteLatest && !Object.values(known.latest).some(Boolean)) {
        return { latest: null, prev: null };
      }

      const latest: Record<string, unknown> = { ...absoluteLatest };
      const prev: Record<string, unknown> = {};
      for (const field of MARKET_PRICE_FIELDS) {
        latest[field] = known.latest[field]?.value ?? null;
        prev[field] = known.previous[field]?.value ?? null;
      }

      return {
        latest: serialise(latest),
        prev: serialise(prev),
      };
    },
    TTL.MARKET_PRICE,
  );

  return NextResponse.json({ data });
}

