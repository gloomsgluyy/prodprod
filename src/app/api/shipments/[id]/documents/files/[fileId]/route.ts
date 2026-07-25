export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canMutateShipmentDocuments, isExecutive } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";

type Ctx = { params: Promise<{ id: string; fileId: string }> };

export async function DELETE(_: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canMutateShipmentDocuments(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, fileId } = await params;

  const file = await prisma.documentFile.findFirst({
    where: {
      id: fileId,
      requirement: { shipmentId: id },
    },
    select: {
      id: true,
      requirementId: true,
      title: true,
      publicUrl: true,
      visibility: true,
      requirement: { select: { requirementCode: true } },
    },
  });

  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (file.visibility === "critical" && !isExecutive(session.user.role)) {
    return NextResponse.json({ error: "Critical documents require executive role" }, { status: 403 });
  }

  const deleted = await prisma.documentFile.update({
    where: { id: fileId },
    data: { isDeleted: true, deletedAt: new Date() },
  });

  await writeAuditLog({
    userId: session.user.id,
    userRole: session.user.role,
    action: "deleted_document_file",
    entity: "shipment",
    entityId: id,
    shipmentId: id,
    details: {
      fileId,
      requirementCode: file.requirement.requirementCode,
      title: file.title,
      publicUrl: file.publicUrl,
    },
  });

  return NextResponse.json({ data: deleted });
}
