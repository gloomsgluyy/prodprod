export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [latestMarket, forecasts, deals, shipments] = await Promise.all([
    prisma.marketPrice.findFirst({
      orderBy: { date: "desc" },
      select: { date: true, ici3: true, ici4: true, hba: true, newcastle: true },
    }),
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
    latestMarket: latestMarket
      ? {
          date: latestMarket.date.toISOString(),
          ici3: latestMarket.ici3 ? Number(latestMarket.ici3) : null,
          ici4: latestMarket.ici4 ? Number(latestMarket.ici4) : null,
          hba: latestMarket.hba ? Number(latestMarket.hba) : null,
          newcastle: latestMarket.newcastle ? Number(latestMarket.newcastle) : null,
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
