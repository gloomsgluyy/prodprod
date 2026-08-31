import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await prisma.calculationHistory.findMany({
    orderBy: { createdAt: "desc" }, take: 20,
    select: {
      id: true, baseIndex: true, baseIndexDate: true, baseIndexValue: true,
      prorataMethod: true, actualTs: true, contractTs: true, actualAsh: true, contractAsh: true,
      qualityAdjustment: true, premiumDiscount: true, description: true, finalPrice: true, createdAt: true,
      createdBy: { select: { name: true } },
    },
  });

  return NextResponse.json({ data: items.map((item) => ({
    ...item,
    baseIndexValue: Number(item.baseIndexValue),
    actualTs: item.actualTs == null ? null : Number(item.actualTs),
    contractTs: item.contractTs == null ? null : Number(item.contractTs),
    actualAsh: item.actualAsh == null ? null : Number(item.actualAsh),
    contractAsh: item.contractAsh == null ? null : Number(item.contractAsh),
    qualityAdjustment: Number(item.qualityAdjustment),
    premiumDiscount: Number(item.premiumDiscount),
    finalPrice: Number(item.finalPrice),
  })) });
}
