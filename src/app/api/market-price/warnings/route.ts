export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLastKnownMarketPrices } from "@/lib/market-price-last-known";

// GAR tiers → market index field mapping
const GAR_TIERS = [
  { minGar: 6000, field: "ici1" },
  { minGar: 5500, field: "ici2" },
  { minGar: 4800, field: "ici3" },
  { minGar: 4000, field: "ici4" },
  { minGar: 0,    field: "ici5" },
] as const;

function closestIndex(gar: number) {
  for (const tier of GAR_TIERS) {
    if (gar >= tier.minGar) return tier.field;
  }
  return "ici5";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const knownMarket = await getLastKnownMarketPrices(["ici1", "ici2", "ici3", "ici4", "ici5"] as const);

  if (!Object.values(knownMarket.latest).some(Boolean)) return NextResponse.json({ data: [], marketDate: null });

  // Get active deals with price and spec
  const deals = await prisma.deal.findMany({
    where: {
      status: { in: ["offer_submitted", "waiting_buyer", "waiting_approval"] },
      pricePerMt: { not: null },
      specGar: { not: null },
    },
    select: { id: true, projectName: true, buyer: true, pricePerMt: true, specGar: true, status: true },
  });

  const marketPrices: Record<string, number> = {
    ici1: Number(knownMarket.latest.ici1?.value ?? 0),
    ici2: Number(knownMarket.latest.ici2?.value ?? 0),
    ici3: Number(knownMarket.latest.ici3?.value ?? 0),
    ici4: Number(knownMarket.latest.ici4?.value ?? 0),
    ici5: Number(knownMarket.latest.ici5?.value ?? 0),
  };

  const warnings = deals
    .map((d) => {
      const dealPrice = Number(d.pricePerMt);
      const gar       = Number(d.specGar);
      const indexKey  = closestIndex(gar);
      const marketRef = marketPrices[indexKey];
      if (!marketRef || marketRef === 0) return null;

      const spreadPct = ((dealPrice - marketRef) / marketRef) * 100;
      if (spreadPct >= -5) return null; // within acceptable range

      return {
        dealId:      d.id,
        projectName: d.projectName,
        buyer:       d.buyer,
        status:      d.status,
        dealPrice,
        marketRef,
        indexUsed:   indexKey,
        spreadPct:   Math.round(spreadPct * 100) / 100,
        severity:    spreadPct < -10 ? "danger" : "warning",
      };
    })
    .filter(Boolean);

  const marketDate = Object.values(knownMarket.latest)
    .filter((value): value is NonNullable<typeof value> => value != null)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]?.date.toISOString() ?? null;

  return NextResponse.json({ data: warnings, marketDate });
}

