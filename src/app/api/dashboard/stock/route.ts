export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sources = await prisma.source.findMany({
    where: { isActive: true },
    select: { id: true, name: true, stockAvailable: true },
    orderBy: { stockAvailable: "desc" },
  });

  const total = sources.reduce((sum, s) => sum + Number(s.stockAvailable ?? 0), 0);
  const top4 = sources.slice(0, 4).map((s) => ({
    id: s.id,
    supplierName: s.name,
    stockAvailable: Number(s.stockAvailable ?? 0),
  }));

  return NextResponse.json({ data: { totalMt: total, top: top4 } });
}

