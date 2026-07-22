export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const docSchema = z.object({
  name:        z.string().min(1),
  type:        z.string().optional(),
  issuedDate:  z.string().optional(),
  expiryDate:  z.string().optional(),
  fileUrl:     z.string().url().optional(),
  status:      z.enum(["valid", "expiring_soon", "expired", "pending"]).default("valid"),
});

function computeStatus(expiryDate?: string): "valid" | "expiring_soon" | "expired" | "pending" {
  if (!expiryDate) return "pending";
  const exp = new Date(expiryDate);
  const now = new Date();
  const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / 86400000);
  if (daysLeft < 0)  return "expired";
  if (daysLeft <= 30) return "expiring_soon";
  return "valid";
}

export async function GET(_: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const partner = await prisma.partner.findUnique({
    where: { id },
    select: { legalDocuments: true },
  });
  if (!partner) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const docs = (partner.legalDocuments as Record<string, unknown>[] | null) ?? [];
  // Re-compute status on read so it stays current
  const enriched = docs.map((d) => ({
    ...d,
    status: computeStatus(d.expiryDate as string | undefined),
  }));

  return NextResponse.json({ data: enriched });
}

export async function POST(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body   = await request.json();
  const parsed = docSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const partner = await prisma.partner.findUnique({
    where: { id },
    select: { legalDocuments: true },
  });
  if (!partner) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const docs = (partner.legalDocuments as Record<string, unknown>[] | null) ?? [];
  const newDoc = {
    ...parsed.data,
    id:        crypto.randomUUID(),
    status:    computeStatus(parsed.data.expiryDate),
    createdAt: new Date().toISOString(),
  };
  docs.push(newDoc);

  await prisma.partner.update({
    where: { id },
    data: { legalDocuments: docs as never },
  });

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "legal_document_added", entity: "partner", entityId: id,
    details: { docName: parsed.data.name, expiryDate: parsed.data.expiryDate },
  });

  return NextResponse.json({ data: newDoc }, { status: 201 });
}
