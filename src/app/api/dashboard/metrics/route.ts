export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isExecutive } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCached, TTL } from "@/lib/cache";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const marketType = searchParams.get("marketType");
  const country = searchParams.get("country");
  const region = searchParams.get("region");
  const timeRange = searchParams.get("timeRange");
  const customStart = searchParams.get("customStart");
  const customEnd = searchParams.get("customEnd");

  const where: Record<string, unknown> = {
    ...(status && status !== "all" ? { status: status as never } : {}),
    ...(marketType && marketType !== "all" ? { type: marketType as never } : {}),
    ...(country && country !== "all" ? { buyerCountry: country } : {}),
  };

  if (timeRange && timeRange !== "all") {
    const now = new Date();
    let start: Date | undefined;
    let end: Date | undefined;

    if (timeRange === "last_30") {
      start = new Date(now);
      start.setDate(start.getDate() - 30);
    } else if (timeRange === "last_90") {
      start = new Date(now);
      start.setDate(start.getDate() - 90);
    } else if (timeRange === "ytd") {
      start = new Date(now.getFullYear(), 0, 1);
    } else if (timeRange === "custom" && customStart && customEnd) {
      start = new Date(customStart);
      end = new Date(customEnd);
      end.setHours(23, 59, 59, 999);
    }

    if (start) {
      where.createdAt = end ? { gte: start, lte: end } : { gte: start };
    }
  }

  const cacheKey = `dashboard:metrics:${JSON.stringify(where)}`;

  const metrics = await getCached(
    cacheKey,
    async () => {
      const [total, active, volumeAgg] = await Promise.all([
        prisma.shipment.count({ where }),
        prisma.shipment.count({ where: { ...where, status: { in: ["loading", "in_transit"] } } }),
        prisma.shipment.aggregate({
          where,
          _sum: { qtyFinal: true, qtyLoaded: true, qtyPlan: true },
        }),
      ]);

      const totalVolume = Number(
        volumeAgg._sum.qtyFinal ?? volumeAgg._sum.qtyLoaded ?? volumeAgg._sum.qtyPlan ?? 0,
      );

      const base = { totalShipments: total, activeShipments: active, totalVolumeMt: totalVolume };

      if (!isExecutive(session.user.role)) return base;

      const finAgg = await prisma.shipment.aggregate({
        where: { ...where, status: "completed" },
        _sum: { qtyFinal: true },
        _avg: { marginMt: true },
      });
      const revenue = await prisma.paymentRecord.aggregate({
        where: { status: "paid" },
        _sum: { amount: true },
      });

      return {
        ...base,
        revenueUsd: Number(revenue._sum.amount ?? 0),
        avgMarginMt: Number(finAgg._avg.marginMt ?? 0),
      };
    },
    TTL.DASHBOARD_METRICS,
  );

  return NextResponse.json({ data: metrics });
}

