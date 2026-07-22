import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string; docId: string }> };

const updateSchema = z.object({
  name:       z.string().min(1).optional(),
  type:       z.string().optional(),
  issuedDate: z.string().optional(),
  expiryDate: z.string().optional(),
  fileUrl:    z.string().url().optional(),
}).partial();

function computeStatus(expiryDate?: string): "valid" | "expiring_soon" | "expired" | "pending" {
  if (!expiryDate) return "pending";
  const daysLeft = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / 86400000);
  if (daysLeft < 0)   return "expired";
  if (daysLeft <= 30) return "expiring_soon";
  return "valid";
}

export async function PUT(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, docId } = await params;
  const body   = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const partner = await prisma.partner.findUnique({
    where: { id },
    select: { legalDocuments: true },
  });
  if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

  const docs = (partner.legalDocuments as Record<string, unknown>[] | null) ?? [];
  const idx  = docs.findIndex((d) => d.id === docId);
  if (idx === -1) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  const merged: Record<string, unknown> = { ...docs[idx], ...parsed.data, updatedAt: new Date().toISOString() };
  if (merged.expiryDate) merged.status = computeStatus(merged.expiryDate as string);
  docs[idx] = merged;

  await prisma.partner.update({ where: { id }, data: { legalDocuments: docs as never } });

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "legal_document_updated", entity: "partner", entityId: id,
    details: { docId, updatedFields: Object.keys(parsed.data) },
  });

  return NextResponse.json({ data: docs[idx] });
}

export async function DELETE(_: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, docId } = await params;
  const partner = await prisma.partner.findUnique({
    where: { id },
    select: { legalDocuments: true },
  });
  if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

  const docs = (partner.legalDocuments as Record<string, unknown>[] | null) ?? [];
  const filtered = docs.filter((d) => d.id !== docId);
  await prisma.partner.update({ where: { id }, data: { legalDocuments: filtered as never } });

  return new NextResponse(null, { status: 204 });
}
