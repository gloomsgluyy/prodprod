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
  const search = searchParams.get("search");
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
    ...(region && region !== "all" ? { region } : {}),
    ...(search ? { OR: [
      { shipmentNumber: { contains: search, mode: "insensitive" as const } },
      { buyer: { contains: search, mode: "insensitive" as const } },
      { vesselName: { contains: search, mode: "insensitive" as const } },
      { project: { projectName: { contains: search, mode: "insensitive" as const } } },
    ] } : {}),
  };

  let start: Date | undefined;
  let end: Date | undefined;

  if (timeRange && timeRange !== "all") {
    const now = new Date();

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
  }

  const cacheKey = `dashboard:metrics:${JSON.stringify({ where, timeRange, customStart, customEnd })}`;

  const metrics = await getCached(
    cacheKey,
    async () => {
      const shipments = await prisma.shipment.findMany({
        where,
        select: {
          status: true, type: true, qtyFinal: true, qtyLoaded: true, qtyPlan: true,
          salesPrice: true, buyingPrice: true, marginMt: true,
          blDate: true, laycanStart: true, eta: true, createdAt: true,
        },
      });

      const inRange = (s: (typeof shipments)[number]) => {
        const d = s.blDate ?? s.laycanStart ?? s.eta ?? s.createdAt;
        return (!start || d >= start) && (!end || d <= end);
      };
      const qty = (s: (typeof shipments)[number]) => Number(s.qtyFinal ?? s.qtyLoaded ?? s.qtyPlan ?? 0);
      const filtered = shipments.filter(inRange);

      const total = filtered.length;
      const active = filtered.filter((s) => ["loading", "in_transit"].includes(s.status)).length;
      const totalVolume = filtered.reduce((sum, s) => sum + qty(s), 0);

      const base = { totalShipments: total, activeShipments: active, totalVolumeMt: totalVolume };

      if (!isExecutive(session.user.role)) return base;

      const commercial = filtered.filter((s) => s.status !== "cancelled");
      const revenueUsd = commercial.reduce((sum, s) => sum + qty(s) * Number(s.salesPrice ?? 0), 0);
      const marginSamples = commercial
        .map((s) => s.marginMt ?? (s.salesPrice && s.buyingPrice ? Number(s.salesPrice) - Number(s.buyingPrice) : null))
        .filter((v): v is number => v != null && Number.isFinite(Number(v)))
        .map(Number);

      return {
        ...base,
        revenueUsd,
        avgMarginMt: marginSamples.length ? marginSamples.reduce((s, v) => s + v, 0) / marginSamples.length : 0,
      };
    },
    TTL.DASHBOARD_METRICS,
  );

  return NextResponse.json({ data: metrics });
}

