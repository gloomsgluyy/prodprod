export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isExecutive } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const QUARTERS = ["Q1","Q2","Q3","Q4"];

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isExecutive(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const year    = Number(searchParams.get("year") ?? new Date().getFullYear());
  const period  = searchParams.get("period") ?? "monthly";

  const startDate = new Date(`${year}-01-01`);
  const endDate   = new Date(`${year}-12-31`);

  const shipments = await prisma.shipment.findMany({
    where: { status: "completed", blDate: { gte: startDate, lte: endDate } },
    select: {
      blDate: true, salesPrice: true, buyingPrice: true, freightRate: true,
      royaltyCost: true, taxExportCost: true, surveyCost: true, financeCost: true,
      qtyFinal: true, qtyLoaded: true, qtyPlan: true,
    },
  });

  const expenses = await prisma.expense.findMany({
    where: { status: "approved", createdAt: { gte: startDate, lte: endDate } },
    select: { amount: true, createdAt: true },
  });

  const bucketCount = period === "quarterly" ? 4 : 12;
  const labels      = period === "quarterly" ? QUARTERS : MONTHS;

  const buckets = Array.from({ length: bucketCount }, (_, i) => ({
    label:   labels[i],
    revenue: 0,
    expense: 0,
    profit:  0,
  }));

  for (const s of shipments) {
    if (!s.blDate) continue;
    const idx = period === "quarterly"
      ? Math.floor(new Date(s.blDate).getMonth() / 3)
      : new Date(s.blDate).getMonth();

    const qty  = Number(s.qtyFinal ?? s.qtyLoaded ?? s.qtyPlan ?? 0);
    const sell = Number(s.salesPrice  ?? 0);
    const cost = (Number(s.buyingPrice ?? 0) + Number(s.freightRate ?? 0) +
                  Number(s.royaltyCost ?? 0) + Number(s.taxExportCost ?? 0) +
                  Number(s.surveyCost  ?? 0) + Number(s.financeCost  ?? 0));

    buckets[idx].revenue += Math.round(sell * qty);
    buckets[idx].expense += Math.round(cost * qty);
  }

  for (const e of expenses) {
    const idx = period === "quarterly"
      ? Math.floor(new Date(e.createdAt).getMonth() / 3)
      : new Date(e.createdAt).getMonth();
    buckets[idx].expense += Math.round(Number(e.amount));
  }

  // Compute profit per bucket
  for (const b of buckets) {
    b.profit = b.revenue - b.expense;
  }

  return NextResponse.json({ data: buckets });
}

