import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string; changeId: string }> };

const schema = z.object({
  status:  z.enum(["approved","rejected"]),
  comment: z.string().optional(),
});

export async function POST(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "CEO")
    return NextResponse.json({ error: "CEO approval required" }, { status: 403 });

  const { id, changeId } = await params;
  const body   = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const change = await prisma.sourceChangeLog.update({
    where: { id: changeId },
    data: {
      ceoApprovalStatus: parsed.data.status,
      ceoApprovedById: session.user.id,
      ceoApprovedAt: new Date(),
      ceoComment: parsed.data.comment,
    },
  });

  // If approved — update shipment source
  if (parsed.data.status === "approved") {
    await prisma.shipment.update({
      where: { id },
      data: { source: change.newSource, supplier: change.newSupplier },
    });
  }

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: `source_change_${parsed.data.status}`, entity: "shipment",
    entityId: id, shipmentId: id,
    details: { changeId, comment: parsed.data.comment },
  });

  return NextResponse.json({ data: change });
}
