export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const year = Number(searchParams.get("year") ?? new Date().getFullYear());

  const shipments = await prisma.shipment.findMany({
    select: { type: true, qtyFinal: true, qtyLoaded: true, qtyPlan: true, blDate: true, laycanStart: true, eta: true, createdAt: true },
  });

  const qty = (s: { qtyFinal: unknown; qtyLoaded: unknown; qtyPlan: unknown }) =>
    Number(s.qtyFinal ?? s.qtyLoaded ?? s.qtyPlan ?? 0);

  const chart = MONTHS.map((month, i) => ({
    month,
    local: 0,
    export: 0,
  }));

  for (const s of shipments) {
    const businessDate = s.blDate ?? s.laycanStart ?? s.eta ?? s.createdAt;
    if (businessDate.getFullYear() !== year) continue;
    const idx = businessDate.getMonth();
    const q = qty(s);
    if (s.type === "domestic") chart[idx].local += q;
    else chart[idx].export += q;
  }

  return NextResponse.json({ data: chart });
}

