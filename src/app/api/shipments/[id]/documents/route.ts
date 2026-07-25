export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canMutateShipmentDocuments, isExecutive } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canMutateShipmentDocuments(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  let docs = await prisma.shipmentDocument.findMany({
    where: { shipmentId: id },
    orderBy: { requirementCode: "asc" },
    include: {
      files: {
        where: { isDeleted: false },
        orderBy: [{ uploadedAt: "desc" }, { version: "desc" }],
      },
    },
  });

  // If no document requirements exist for this shipment, auto-initialize the 11 standard SRS requirements
  if (docs.length === 0) {
    const DEFAULT_DOCS = [
      { code: "a", label: "Copy Laporan Hasil Verifikasi (LHV)" },
      { code: "b", label: "1 Original Draught Survey Report" },
      { code: "c", label: "1 Original Surat Keterangan Asal Barang" },
      { code: "d", label: "1 Original Surat Kebenaran Dokumen" },
      { code: "e", label: "1 Original Surat Kirim Barang" },
      { code: "f", label: "1 Original Bukti Bayar Royalti" },
      { code: "g", label: "3/3 Original Bill of Lading" },
      { code: "h", label: "3/3 Copies Non Negotiable Bill of Lading" },
      { code: "i", label: "Certificate of Sampling and Analysis" },
      { code: "j", label: "Certificate of Weight" },
      { code: "k", label: "Certificate of Draught Survey Report" },
    ];

    await prisma.shipmentDocument.createMany({
      data: DEFAULT_DOCS.map((d) => ({
        shipmentId: id,
        requirementCode: d.code,
        label: d.label,
        status: "pending" as const,
      })),
      skipDuplicates: true,
    });

    docs = await prisma.shipmentDocument.findMany({
      where: { shipmentId: id },
      orderBy: { requirementCode: "asc" },
      include: {
        files: {
          where: { isDeleted: false },
          orderBy: [{ uploadedAt: "desc" }, { version: "desc" }],
        },
      },
    });
  }


  const now = new Date();
  const data = docs.map((d) => ({
    ...d,
    fileCount: d.files.length,
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
  fileTitle:      z.string().optional(),
  visibility:     z.enum(["public","internal","critical"]).optional(),
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

  const { fileTitle, visibility, ...docPatch } = parsed.data;
  if (visibility === "critical" && !isExecutive(session.user.role)) {
    return NextResponse.json({ error: "Critical documents require executive role" }, { status: 403 });
  }
  const data: Record<string, unknown> = { ...docPatch };
  if (docPatch.fileUrl) {
    data.uploadedBy = session.user.id;
    data.uploadedAt = new Date();
    if (!docPatch.status) data.status = "completed";
  }


  const doc = await prisma.shipmentDocument.update({
    where: { shipmentId_requirementCode: { shipmentId: id, requirementCode } },
    data,
  });

  if (docPatch.fileUrl) {
    const latest = await prisma.documentFile.findFirst({
      where: { requirementId: doc.id, isDeleted: false },
      orderBy: { version: "desc" },
      select: { version: true },
    });

    await prisma.documentFile.create({
      data: {
        requirementId: doc.id,
        sourceModule: "shipment",
        sourceEntityId: id,
        title: fileTitle || docPatch.fileName || doc.label,
        originalName: docPatch.fileName || docPatch.fileUrl.split("/").pop() || doc.label,
        size: docPatch.fileSize ?? null,
        provider: "external_url",
        publicUrl: docPatch.fileUrl,
        visibility: visibility ?? "internal",
        version: (latest?.version ?? 0) + 1,
        uploadedBy: session.user.id,
      },
    });
  }

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "updated_document", entity: "shipment", entityId: id, shipmentId: id,
    details: {
      requirementCode,
      status: docPatch.status,
      addedFile: !!docPatch.fileUrl,
    },
  });

  const updated = await prisma.shipmentDocument.findUnique({
    where: { shipmentId_requirementCode: { shipmentId: id, requirementCode } },
    include: {
      files: {
        where: { isDeleted: false },
        orderBy: [{ uploadedAt: "desc" }, { version: "desc" }],
      },
    },
  });

  return NextResponse.json({ data: updated });
}
