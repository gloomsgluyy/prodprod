export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isExecutive } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 25;

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isExecutive(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const year = searchParams.get("year");

  const where = {
    status: "completed" as const,
    ...(year ? { blDate: { gte: new Date(`${year}-01-01`), lte: new Date(`${year}-12-31`) } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.shipment.findMany({
      where,
      orderBy: { blDate: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      select: {
        id: true, shipmentNumber: true, buyer: true,
        qtyFinal: true, qtyLoaded: true, qtyPlan: true, blDate: true,
        salesPrice: true, buyingPrice: true, freightRate: true,
        royaltyCost: true, taxExportCost: true, surveyCost: true, financeCost: true,
        marginMt: true,
        project: { select: { marginEst: true } },
      },
    }),
    prisma.shipment.count({ where }),
  ]);

  const data = items.map((s) => {
    const qty          = Number(s.qtyFinal ?? s.qtyLoaded ?? s.qtyPlan ?? 0);
    const sell         = Number(s.salesPrice  ?? 0);
    const buy          = Number(s.buyingPrice ?? 0);
    const frt          = Number(s.freightRate ?? 0);
    const totalCostMt  = buy + frt + Number(s.royaltyCost ?? 0) + Number(s.taxExportCost ?? 0) + Number(s.surveyCost ?? 0) + Number(s.financeCost ?? 0);
    const actualMargin = Number(s.marginMt ?? (sell - totalCostMt));
    const estMargin    = Number(s.project?.marginEst ?? 0);
    const deviation    = estMargin > 0 ? Math.round((actualMargin - estMargin) * 100) / 100 : null;

    return {
      id:            s.id,
      shipmentNumber:s.shipmentNumber,
      buyer:         s.buyer,
      blDate:        s.blDate?.toISOString() ?? null,
      qty:           Math.round(qty),
      sellPrice:     sell,
      buyPrice:      buy,
      freightRate:   frt,
      totalCostMt:   Math.round(totalCostMt * 100) / 100,
      actualMarginMt:Math.round(actualMargin * 100) / 100,
      totalMargin:   Math.round(actualMargin * qty),
      revenue:       Math.round(sell * qty),
      estMarginMt:   estMargin || null,
      deviation,
    };
  });

  return NextResponse.json({
    data,
    meta: { total, page, pageSize: PAGE_SIZE, totalPages: Math.ceil(total / PAGE_SIZE) },
  });
}

