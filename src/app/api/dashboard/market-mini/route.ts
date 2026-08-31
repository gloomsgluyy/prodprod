export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCached, TTL } from "@/lib/cache";
import { getLastKnownMarketPrices } from "@/lib/market-price-last-known";

const PRICE_FIELDS = ["ici1","ici2","ici3","ici4","ici5","newcastle","hba","hba1","hba2","hba3"] as const;

function serialise(row: Record<string, unknown> | null) {
  if (!row) return null;
  const out: Record<string, unknown> = { ...row };
  for (const f of PRICE_FIELDS) {
    if (out[f] != null) out[f] = Number(out[f]);
  }
  return out;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await getCached(
    "dashboard:market-mini",
    async () => {
      const [absoluteLatest, known] = await Promise.all([
        prisma.marketPrice.findFirst({
          orderBy: { createdAt: "desc" },
          select: { id: true, date: true, createdAt: true },
        }),
        getLastKnownMarketPrices(PRICE_FIELDS),
      ]);
      if (!absoluteLatest && !Object.values(known.latest).some(Boolean)) return { latest: null, prev: null };

      const latest: Record<string, unknown> = { ...absoluteLatest };
      const prev: Record<string, unknown> = {};
      for (const field of PRICE_FIELDS) {
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

