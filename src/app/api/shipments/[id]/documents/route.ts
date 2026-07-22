export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const docs = await prisma.shipmentDocument.findMany({
    where: { shipmentId: id },
    orderBy: { requirementCode: "asc" },
  });

  const now = new Date();
  const data = docs.map((d) => ({
    ...d,
    agingDays: d.receivedDate
      ? Math.floor((now.getTime() - new Date(d.receivedDate).getTime()) / 86400000)
      : null,
  }));

  return NextResponse.json({ data });
}

const updateDocSchema = z.object({
  status:        z.enum(["pending","received","submitted","completed","not_required"]).optional(),
  receivedDate:  z.string().optional().nullable(),
  submittedDate: z.string().optional().nullable(),
  submittedTo:   z.string().optional(),
  fileUrl:       z.string().url().optional().nullable(),
  fileName:      z.string().optional(),
  fileSize:      z.number().int().optional(),
  hardcopyStatus:z.string().optional(),
  owner:         z.string().optional(),
  pic:           z.string().optional(),
  notes:         z.string().optional(),
  uploadedBy:    z.string().optional(),
}).partial();

export async function PATCH(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  // body.requirementCode identifies which doc to update
  const { requirementCode, ...rest } = body;
  if (!requirementCode)
    return NextResponse.json({ error: "requirementCode required" }, { status: 422 });

  const parsed = updateDocSchema.safeParse(rest);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.fileUrl) {
    data.uploadedBy = session.user.id;
    data.uploadedAt = new Date();
  }

  const doc = await prisma.shipmentDocument.update({
    where: { shipmentId_requirementCode: { shipmentId: id, requirementCode } },
    data,
  });

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "updated_document", entity: "shipment", entityId: id, shipmentId: id,
    details: { requirementCode, status: parsed.data.status },
  });

  return NextResponse.json({ data: doc });
}
