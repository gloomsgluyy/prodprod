export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();

  // Only docs that have been received but not completed, with a received date
  const docs = await prisma.shipmentDocument.findMany({
    where: {
      status: { in: ["received", "submitted"] },
      receivedDate: { not: null },
    },
    select: {
      requirementCode: true,
      label: true,
      owner: true,
      pic: true,
      hardcopyStatus: true,
      receivedDate: true,
      shipment: { select: { id: true, shipmentNumber: true } },
    },
  });

  const alerts = docs
    .map((d) => {
      const agingDays = Math.floor(
        (now.getTime() - new Date(d.receivedDate!).getTime()) / (1000 * 60 * 60 * 24),
      );
      return {
        shipmentId: d.shipment.id,
        shipmentNumber: d.shipment.shipmentNumber,
        requirementCode: d.requirementCode,
        label: d.label,
        owner: d.owner,
        pic: d.pic,
        hardcopyStatus: d.hardcopyStatus,
        agingDays,
        severity: agingDays > 30 ? "critical" : "warning",
      };
    })
    .filter((d) => d.agingDays >= 15)
    .sort((a, b) => b.agingDays - a.agingDays);

  return NextResponse.json({ data: alerts });
}

