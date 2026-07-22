export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isExecutive } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isExecutive(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const threshold = Number(searchParams.get("threshold") ?? 10); // percent

  const shipments = await prisma.shipment.findMany({
    where: { status: "completed", project: { marginEst: { not: null } } },
    select: {
      id: true, shipmentNumber: true, buyer: true, blDate: true,
      salesPrice: true, buyingPrice: true, freightRate: true,
      royaltyCost: true, taxExportCost: true, surveyCost: true, financeCost: true,
      marginMt: true, qtyFinal: true, qtyLoaded: true, qtyPlan: true,
      project: { select: { id: true, projectName: true, marginEst: true } },
    },
    orderBy: { blDate: "desc" },
    take: 200,
  });

  const alerts = shipments
    .map((s) => {
      const sell        = Number(s.salesPrice  ?? 0);
      const buy         = Number(s.buyingPrice ?? 0);
      const frt         = Number(s.freightRate ?? 0);
      const totalCostMt = buy + frt + Number(s.royaltyCost ?? 0) + Number(s.taxExportCost ?? 0) + Number(s.surveyCost ?? 0) + Number(s.financeCost ?? 0);
      const actualMargin= Number(s.marginMt ?? (sell - totalCostMt));
      const estMargin   = Number(s.project?.marginEst ?? 0);
      if (estMargin === 0) return null;
      const deviationPct = ((actualMargin - estMargin) / Math.abs(estMargin)) * 100;
      if (Math.abs(deviationPct) <= threshold) return null;
      const qty = Number(s.qtyFinal ?? s.qtyLoaded ?? s.qtyPlan ?? 0);
      return {
        shipmentId:     s.id,
        shipmentNumber: s.shipmentNumber,
        buyer:          s.buyer,
        blDate:         s.blDate?.toISOString() ?? null,
        projectId:      s.project?.id,
        projectName:    s.project?.projectName,
        actualMarginMt: Math.round(actualMargin * 100) / 100,
        estMarginMt:    Math.round(estMargin  * 100) / 100,
        deviationPct:   Math.round(deviationPct * 100) / 100,
        totalMargin:    Math.round(actualMargin * qty),
        severity:       Math.abs(deviationPct) > 20 ? "critical" : "warning",
      };
    })
    .filter(Boolean);

  return NextResponse.json({ data: alerts, threshold });
}

