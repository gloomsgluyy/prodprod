export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type SalesRollup = {
  projectId: string | null;
  projectName: string;
  buyer: string;
  segment: string | null;
  forecastStatus: string | null;
  salesStatus: string;
  dealCount: number;
  shipmentCount: number;
  qtyTotal: number;
  revenueEstimate: number;
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [forecasts, deals, shipments] = await Promise.all([
    prisma.forecastProject.findMany({
      where: { status: { notIn: ["draft", "rejected", "cancelled"] } },
      select: {
        id: true, projectName: true, buyer: true, buyerCountry: true,
        segment: true, quantity: true, status: true,
        buyerFeedbackStatus: true, fcoNumber: true,
        _count: { select: { shipments: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.deal.findMany({
      where: { status: { notIn: ["cancelled", "rejected"] } },
      select: {
        id: true, projectId: true, projectName: true, buyer: true,
        segment: true, quantity: true, pricePerMt: true, status: true,
      },
    }),
    prisma.shipment.findMany({
      where: { status: { notIn: ["cancelled"] } },
      select: {
        id: true, projectId: true, buyer: true, qtyPlan: true,
        salesPrice: true, status: true,
      },
    }),
  ]);

  const map = new Map<string, SalesRollup>();

  forecasts.forEach((f) => {
    const key = f.id;
    map.set(key, {
      projectId: f.id,
      projectName: f.projectName,
      buyer: f.buyer,
      segment: f.segment,
      forecastStatus: f.status,
      salesStatus: resolveSalesStatus(f.status, f.buyerFeedbackStatus, f.fcoNumber),
      dealCount: 0,
      shipmentCount: f._count.shipments,
      qtyTotal: Number(f.quantity ?? 0),
      revenueEstimate: 0,
    });
  });

  deals.forEach((d) => {
    const key = d.projectId ?? `deal-${d.id}`;
    let row = map.get(key);
    if (!row) {
      row = {
        projectId: d.projectId,
        projectName: d.projectName ?? "Unmapped Deal",
        buyer: d.buyer,
        segment: d.segment,
        forecastStatus: null,
        salesStatus: d.status === "confirmed" ? "confirmed" : "offer_submitted",
        dealCount: 0,
        shipmentCount: 0,
        qtyTotal: 0,
        revenueEstimate: 0,
      };
      map.set(key, row);
    }
    row.dealCount += 1;
    row.qtyTotal += Number(d.quantity ?? 0);
    row.revenueEstimate += Number(d.quantity ?? 0) * Number(d.pricePerMt ?? 0);
  });

  shipments.forEach((s) => {
    const key = s.projectId ?? `shipment-${s.id}`;
    let row = map.get(key);
    if (!row) {
      row = {
        projectId: s.projectId,
        projectName: "Unmapped Shipment",
        buyer: s.buyer,
        segment: null,
        forecastStatus: null,
        salesStatus: s.status === "completed" ? "completed" : s.status === "in_transit" ? "in_transit" : "confirmed",
        dealCount: 0,
        shipmentCount: 0,
        qtyTotal: 0,
        revenueEstimate: 0,
      };
      map.set(key, row);
    }
    const qty = Number(s.qtyPlan ?? 0);
    const price = Number(s.salesPrice ?? 0);
    row.qtyTotal += qty;
    if (price > 0) row.revenueEstimate += qty * price;
    if (s.status === "completed") row.salesStatus = "completed";
    else if (s.status === "in_transit" && row.salesStatus !== "completed") row.salesStatus = "in_transit";
  });

  const rollup = Array.from(map.values()).sort((a, b) => b.qtyTotal - a.qtyTotal);

  const summary = {
    totalRevenue: rollup.reduce((s, r) => s + r.revenueEstimate, 0),
    totalVolume: rollup.reduce((s, r) => s + r.qtyTotal, 0),
    totalDeals: rollup.reduce((s, r) => s + r.dealCount, 0),
    totalShipments: rollup.reduce((s, r) => s + r.shipmentCount, 0),
  };

  return NextResponse.json({ data: rollup, summary });
}

function resolveSalesStatus(
  forecastStatus: string,
  buyerFeedbackStatus: string | null,
  fcoNumber: string | null
): string {
  if (forecastStatus === "waiting_approval") return "waiting_approval";
  if (forecastStatus === "rejected") return "rejected";
  if (buyerFeedbackStatus === "deal") return "confirmed";
  if (buyerFeedbackStatus === "failed") return "rejected";
  if (buyerFeedbackStatus === "negotiation") return "offer_submitted";
  if (buyerFeedbackStatus === "waiting_feedback" || buyerFeedbackStatus === "fco_sent") return "offer_submitted";
  if (fcoNumber) return "offer_submitted";
  if (forecastStatus === "approved") return "waiting_buyer";
  return "waiting_buyer";
}
