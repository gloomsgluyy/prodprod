export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLastKnownMarketPrices } from "@/lib/market-price-last-known";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [knownMarket, forecasts, deals, shipments] = await Promise.all([
    getLastKnownMarketPrices(["ici3", "ici4", "hba", "newcastle"] as const),
    prisma.forecastProject.findMany({
      where: { status: { notIn: ["draft", "rejected", "cancelled"] } },
      select: { salesPriceEst: true, buyingPriceEst: true },
    }),
    prisma.deal.findMany({
      where: { status: { notIn: ["cancelled", "rejected"] } },
      select: { pricePerMt: true, quantity: true },
    }),
    prisma.shipment.findMany({
      where: { status: { notIn: ["cancelled"] } },
      select: { salesPrice: true, buyingPrice: true, qtyFinal: true, qtyLoaded: true, qtyPlan: true },
    }),
  ]);

  const salesPrices: number[] = [];
  const buyingPrices: number[] = [];

  forecasts.forEach((f) => {
    if (f.salesPriceEst) salesPrices.push(Number(f.salesPriceEst));
    if (f.buyingPriceEst) buyingPrices.push(Number(f.buyingPriceEst));
  });

  deals.forEach((d) => {
    if (d.pricePerMt) salesPrices.push(Number(d.pricePerMt));
  });

  shipments.forEach((s) => {
    if (s.salesPrice) salesPrices.push(Number(s.salesPrice));
    if (s.buyingPrice) buyingPrices.push(Number(s.buyingPrice));
  });

  const avgSales = salesPrices.length
    ? salesPrices.reduce((a, b) => a + b, 0) / salesPrices.length
    : 0;

  const avgBuying = buyingPrices.length
    ? buyingPrices.reduce((a, b) => a + b, 0) / buyingPrices.length
    : 0;

  const margin = avgSales - avgBuying;

  const comparison = {
    latestMarket: Object.values(knownMarket.latest).some(Boolean)
      ? {
          date: Object.values(knownMarket.latest)
            .filter((value): value is NonNullable<typeof value> => value != null)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0].date.toISOString(),
          ici3: knownMarket.latest.ici3 ? Number(knownMarket.latest.ici3.value) : null,
          ici4: knownMarket.latest.ici4 ? Number(knownMarket.latest.ici4.value) : null,
          hba: knownMarket.latest.hba ? Number(knownMarket.latest.hba.value) : null,
          newcastle: knownMarket.latest.newcastle ? Number(knownMarket.latest.newcastle.value) : null,
        }
      : null,
    avgSalesPrice: avgSales,
    avgBuyingPrice: avgBuying,
    salesSpread: avgSales,
    buyingSpread: avgBuying,
    margin,
    dealCount: deals.length,
    shipmentCount: shipments.length,
    forecastCount: forecasts.length,
  };

  return NextResponse.json({ data: comparison });
}
