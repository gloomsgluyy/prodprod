export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const sendSchema = z.object({
  bargeOwnerName:        z.string().min(1),
  siReference:           z.string().optional(), // SI number reference
  sentDate:              z.string(),
  sendMethod:            z.enum(["email","whatsapp","courier","meeting"]),
  recipientName:         z.string().min(1),
  recipientContact:      z.string().optional(),
  confirmationReceived:  z.boolean().default(false),
  confirmationDate:      z.string().optional().nullable(),
  proofFileUrl:          z.string().url().optional(),
  notes:                 z.string().optional(),
});

type SiSend = z.infer<typeof sendSchema> & { id: string; createdAt: string };

function getSiSends(milestones: unknown): SiSend[] {
  const m = milestones as Record<string, unknown> | null;
  if (!m || Array.isArray(m)) return [];
  return (m.siSends as SiSend[] | undefined) ?? [];
}

export async function GET(_: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const record = await prisma.transshipment.findUnique({ where: { id }, select: { milestones: true } });
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ data: getSiSends(record.milestones) });
}

export async function POST(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body   = await request.json();
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const record = await prisma.transshipment.findUnique({ where: { id }, select: { milestones: true, shipmentId: true } });
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const m    = record.milestones as Record<string, unknown> | null;
  const base = (Array.isArray(m) ? {} : (m ?? {})) as Record<string, unknown>;
  const sends = getSiSends(record.milestones);

  const newSend: SiSend = { ...parsed.data, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  sends.push(newSend);

  await prisma.transshipment.update({
    where: { id },
    data: { milestones: { ...base, siSends: sends } },
  });

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "si_sent_to_barge", entity: "transshipment", entityId: id,
    shipmentId: record.shipmentId ?? undefined,
    details: { bargeOwnerName: parsed.data.bargeOwnerName, sendMethod: parsed.data.sendMethod, sentDate: parsed.data.sentDate },
  });

  return NextResponse.json({ data: newSend }, { status: 201 });
}

// Confirm receipt by barge owner
export async function PATCH(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { sendId, confirmationReceived, confirmationDate } = await request.json();
  if (!sendId) return NextResponse.json({ error: "sendId required" }, { status: 422 });

  const record = await prisma.transshipment.findUnique({ where: { id }, select: { milestones: true } });
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const m     = record.milestones as Record<string, unknown> | null;
  const base  = (Array.isArray(m) ? {} : (m ?? {})) as Record<string, unknown>;
  const sends = getSiSends(record.milestones);
  const idx   = sends.findIndex((s) => s.id === sendId);
  if (idx === -1) return NextResponse.json({ error: "Record not found" }, { status: 404 });

  sends[idx] = { ...sends[idx], confirmationReceived: confirmationReceived ?? true, confirmationDate: confirmationDate ?? new Date().toISOString() };

  await prisma.transshipment.update({ where: { id }, data: { milestones: { ...base, siSends: sends } } });

  return NextResponse.json({ data: sends[idx] });
}
