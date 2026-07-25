/**
 * Binary file upload for shipment documents.
 * Route: POST /api/shipments/[id]/documents/upload
 *
 * Accepts multipart/form-data with fields:
 *   - file: File (binary)
 *   - requirementCode: string
 *   - fileTitle: string (optional)
 *   - visibility: "public" | "internal" | "critical" (default: "internal")
 *
 * Saves to local storage via src/lib/storage.ts and creates a DocumentFile record.
 */

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canMutateShipmentDocuments, isExecutive } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { saveFile } from "@/lib/storage";
import { writeAuditLog } from "@/lib/audit";

type Ctx = { params: Promise<{ id: string }> };

const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
  "image/webp",
]);

const MAX_SIZE = 20 * 1024 * 1024; // 20 MB

export async function POST(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canMutateShipmentDocuments(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart/form-data" }, { status: 400 });
  }

  const fileField       = formData.get("file") as File | null;
  const requirementCode = (formData.get("requirementCode") as string | null)?.trim();
  const fileTitle       = (formData.get("fileTitle") as string | null)?.trim() ?? "";
  const visibility      = (formData.get("visibility") as string | null) ?? "internal";

  if (!fileField)
    return NextResponse.json({ error: "No file uploaded" }, { status: 422 });
  if (!requirementCode)
    return NextResponse.json({ error: "requirementCode is required" }, { status: 422 });
  if (!["public", "internal", "critical"].includes(visibility))
    return NextResponse.json({ error: "Invalid visibility" }, { status: 422 });
  if (visibility === "critical" && !isExecutive(session.user.role))
    return NextResponse.json({ error: "Critical documents require executive role" }, { status: 403 });

  if (!ALLOWED_MIME.has(fileField.type))
    return NextResponse.json({
      error: `File type "${fileField.type}" is not allowed. Allowed: PDF, DOCX, PNG, JPG, WEBP`,
    }, { status: 422 });

  if (fileField.size > MAX_SIZE)
    return NextResponse.json({ error: "File size exceeds 20 MB limit" }, { status: 413 });

  // Ensure the shipment document requirement exists (upsert creates it if not)
  const doc = await prisma.shipmentDocument.upsert({
    where: { shipmentId_requirementCode: { shipmentId: id, requirementCode } },
    create: {
      shipmentId: id,
      requirementCode,
      label: requirementCode,
      uploadedBy: session.user.id,
      uploadedAt: new Date(),
    },
    update: {
      uploadedBy: session.user.id,
      uploadedAt: new Date(),
    },
  });

  // Read buffer
  const buffer = Buffer.from(await fileField.arrayBuffer());

  // Save to local storage
  const { objectKey, publicUrl } = await saveFile(
    buffer,
    `shipments/${id}`,
    fileField.name
  );

  // Latest version
  const latest = await prisma.documentFile.findFirst({
    where: { requirementId: doc.id, isDeleted: false },
    orderBy: { version: "desc" },
    select: { version: true },
  });

  const fileRecord = await prisma.documentFile.create({
    data: {
      requirementId: doc.id,
      sourceModule:  "shipment",
      sourceEntityId: id,
      title:         fileTitle || fileField.name,
      originalName:  fileField.name,
      mimeType:      fileField.type,
      size:          fileField.size,
      provider:      "local",
      objectKey,
      publicUrl,
      visibility,
      version:       (latest?.version ?? 0) + 1,
      uploadedBy:    session.user.id,
    },
  });

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "uploaded_document_file", entity: "shipment", entityId: id, shipmentId: id,
    details: { requirementCode, fileName: fileField.name, size: fileField.size, visibility },
  });

  return NextResponse.json({ data: fileRecord }, { status: 201 });
}
