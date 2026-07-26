export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const year = Number(searchParams.get("year") ?? new Date().getFullYear());
  const segment = searchParams.get("segment") ?? "total"; // total | local | export

  const typeFilter = segment === "local" ? { type: "domestic" as const }
    : segment === "export" ? { type: "export" as const }
    : {};

  const shipments = await prisma.shipment.findMany({
    where: typeFilter,
    select: { status: true, qtyFinal: true, qtyLoaded: true, qtyPlan: true, blDate: true, laycanStart: true, eta: true, createdAt: true },
  });

  const qty = (s: { qtyFinal: unknown; qtyLoaded: unknown; qtyPlan: unknown }) =>
    Number(s.qtyFinal ?? s.qtyLoaded ?? s.qtyPlan ?? 0);

  const byStatus = {
    upcoming: 0, loading: 0, in_transit: 0, completed: 0, cancelled: 0,
  } as Record<string, number>;

  let total = 0;
  for (const s of shipments) {
    const businessDate = s.blDate ?? s.laycanStart ?? s.eta ?? s.createdAt;
    if (businessDate.getFullYear() !== year) continue;
    const q = qty(s);
    byStatus[s.status] = (byStatus[s.status] ?? 0) + q;
    total += q;
  }

  return NextResponse.json({ data: { total, byStatus, year, segment } });
}

