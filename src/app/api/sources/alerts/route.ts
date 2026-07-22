export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sources = await prisma.source.findMany({
    where: {
      isActive: true,
      minStockAlert: { not: null },
    },
    select: { id: true, name: true, region: true, stockAvailable: true, minStockAlert: true, kycStatus: true, psiStatus: true },
  });

  const alerts = sources
    .filter((s) => {
      const stock = Number(s.stockAvailable ?? 0);
      const threshold = Number(s.minStockAlert ?? 0);
      return stock <= threshold;
    })
    .map((s) => {
      const stock = Number(s.stockAvailable ?? 0);
      const threshold = Number(s.minStockAlert ?? 0);
      return {
        id: s.id,
        name: s.name,
        region: s.region,
        stockAvailable: stock,
        minStockAlert: threshold,
        alertLevel: stock <= threshold * 0.5 ? "critical" : "warning",
      };
    })
    .sort((a, b) => a.stockAvailable - b.stockAvailable);

  return NextResponse.json({ data: alerts });
}

