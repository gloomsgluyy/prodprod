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
    const latest = await prisma.marketPrice.findFirst({
      where: { OR: [{ mgoUsd: { not: null } }, { usdIdr: { not: null } }] },
      orderBy: { createdAt: "desc" },
      select: { mgoUsd: true, usdIdr: true, date: true, createdAt: true },
    });
    if (!latest) return { mgoUsd: null, usdIdr: null, date: null, updatedAt: null };
    return {
      mgoUsd: latest.mgoUsd ? Number(latest.mgoUsd) : null,
      usdIdr: latest.usdIdr ? Number(latest.usdIdr) : null,
      date: latest.date?.toISOString() ?? null,
      updatedAt: latest.createdAt?.toISOString() ?? null,
    };
  }, TTL.MARKET_PRICE ?? 300);

  return NextResponse.json({ data });
}

