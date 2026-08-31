export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shipments = await prisma.shipment.findMany({
    where: { status: { in: ["upcoming", "loading", "in_transit"] } },
    select: {
      id: true, shipmentNumber: true, buyer: true,
      vesselName: true, bargeName: true, pol: true,
      qtyPlan: true, qtyLoaded: true, blDate: true,
      status: true, completionScore: true,
      issues: { where: { status: { in: ["open", "in_progress"] } }, select: { id: true, description: true }, orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  // Serialise Prisma Decimals → numbers
  const data = shipments.map((s) => ({
    ...s,
    qtyPlan:         s.qtyPlan         != null ? Number(s.qtyPlan)         : null,
    qtyLoaded:       s.qtyLoaded       != null ? Number(s.qtyLoaded)       : null,
    completionScore: s.completionScore != null ? Number(s.completionScore) : null,
    openIssueCount: s.issues.length,
    currentStage: s.status === "upcoming" ? "Ready to Load" : s.status === "loading" ? "Loading" : "In Transit",
    issueNote: s.issues[0]?.description ?? null,
  }));

  return NextResponse.json({ data });
}

