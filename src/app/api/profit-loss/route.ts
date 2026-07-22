export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isExecutive } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCached, TTL } from "@/lib/cache";

// Executive-only endpoint
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isExecutive(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const year    = Number(searchParams.get("year") ?? new Date().getFullYear());
  const period  = searchParams.get("period") ?? "monthly"; // monthly | quarterly

  const cacheKey = `pl:summary:${year}:${period}`;

  const data = await getCached(cacheKey, async () => {
    const startDate = new Date(`${year}-01-01`);
    const endDate   = new Date(`${year}-12-31`);

    // Revenue: sum(salesPrice × qtyFinal) for completed shipments
    const completedShipments = await prisma.shipment.findMany({
      where: {
        status: "completed",
        blDate: { gte: startDate, lte: endDate },
      },
      select: {
        salesPrice: true, buyingPrice: true, freightRate: true,
        royaltyCost: true, taxExportCost: true, surveyCost: true, financeCost: true,
        qtyFinal: true, qtyLoaded: true, qtyPlan: true,
      },
    });

    let totalRevenue = 0;
    let totalCost    = 0;

    for (const s of completedShipments) {
      const qty  = Number(s.qtyFinal ?? s.qtyLoaded ?? s.qtyPlan ?? 0);
      const sell = Number(s.salesPrice  ?? 0);
      const buy  = Number(s.buyingPrice ?? 0);
      const frt  = Number(s.freightRate ?? 0);
      const roy  = Number(s.royaltyCost  ?? 0);
      const tax  = Number(s.taxExportCost ?? 0);
      const srv  = Number(s.surveyCost  ?? 0);
      const fin  = Number(s.financeCost ?? 0);

      totalRevenue += sell * qty;
      totalCost    += (buy + frt + roy + tax + srv + fin) * qty;
    }

    // Approved expenses for this year
    const expenseAgg = await prisma.expense.aggregate({
      where: {
        status: "approved",
        createdAt: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
    });
    const totalExpenses = Number(expenseAgg._sum.amount ?? 0);
    const totalCostAll  = totalCost + totalExpenses;
    const netProfit     = totalRevenue - totalCostAll;
    const marginPct     = totalRevenue > 0
      ? Math.round((netProfit / totalRevenue) * 10000) / 100
      : 0;

    return {
      year,
      totalRevenue:  Math.round(totalRevenue),
      totalCost:     Math.round(totalCostAll),
      netProfit:     Math.round(netProfit),
      marginPct,
      shipmentCount: completedShipments.length,
    };
  }, TTL.SHIPMENT_LIST);

  return NextResponse.json({ data });
}

