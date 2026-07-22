export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const spalSchema = z.object({
  spalNumber:        z.string().min(1),
  issuedDate:        z.string(),
  issuingAuthority:  z.string().min(1),
  pol:               z.string().min(1),
  bargeOwnerName:    z.string().optional(),
  tbBgName:          z.string().min(1),
  mvName:            z.string().min(1),
  commodity:         z.string().default("Coal"),
  quantityApproved:  z.coerce.number().positive(),
  validityStart:     z.string(),
  validityEnd:       z.string(),
  status:            z.enum(["active","expired","cancelled"]).default("active"),
  fileUrl:           z.string().url().optional(),
  notes:             z.string().optional(),
});

type SpalDoc = z.infer<typeof spalSchema> & { id: string; createdAt: string };

function getSpal(milestones: unknown): SpalDoc[] {
  const m = milestones as Record<string, unknown> | null;
  if (!m || Array.isArray(m)) return [];
  return (m.spalDocuments as SpalDoc[] | undefined) ?? [];
}

export async function GET(_: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const record = await prisma.transshipment.findUnique({ where: { id }, select: { milestones: true } });
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Auto-refresh expired status
  const now  = new Date();
  const docs = getSpal(record.milestones).map((s) => ({
    ...s,
    status: s.status === "cancelled" ? "cancelled" : new Date(s.validityEnd) < now ? "expired" : "active",
  }));

  return NextResponse.json({ data: docs });
}

export async function POST(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body   = await request.json();
  const parsed = spalSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const record = await prisma.transshipment.findUnique({ where: { id }, select: { milestones: true } });
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const m    = record.milestones as Record<string, unknown> | null;
  const base = (Array.isArray(m) ? {} : (m ?? {})) as Record<string, unknown>;
  const docs = getSpal(record.milestones);

  const newDoc: SpalDoc = { ...parsed.data, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  docs.push(newDoc);

  await prisma.transshipment.update({
    where: { id },
    data: { milestones: { ...base, spalDocuments: docs } },
  });

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "spal_added", entity: "transshipment", entityId: id,
    details: { spalNumber: parsed.data.spalNumber, validityEnd: parsed.data.validityEnd },
  });

  return NextResponse.json({ data: newDoc }, { status: 201 });
}

export async function PUT(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { spalId, ...updates } = await request.json();
  if (!spalId) return NextResponse.json({ error: "spalId required" }, { status: 422 });

  const record = await prisma.transshipment.findUnique({ where: { id }, select: { milestones: true } });
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const m    = record.milestones as Record<string, unknown> | null;
  const base = (Array.isArray(m) ? {} : (m ?? {})) as Record<string, unknown>;
  const docs = getSpal(record.milestones);
  const idx  = docs.findIndex((s) => s.id === spalId);
  if (idx === -1) return NextResponse.json({ error: "SPAL not found" }, { status: 404 });

  docs[idx] = { ...docs[idx], ...updates, updatedAt: new Date().toISOString() } as SpalDoc;
  await prisma.transshipment.update({ where: { id }, data: { milestones: { ...base, spalDocuments: docs } } });

  return NextResponse.json({ data: docs[idx] });
}
