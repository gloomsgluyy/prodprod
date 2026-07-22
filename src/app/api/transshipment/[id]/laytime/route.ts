export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({
  norTendered:          z.string().optional(),
  laytimeCommenced:     z.string().optional(),
  berthing:             z.string().optional().nullable(),
  commenceLoading:      z.string().optional().nullable(),
  completeLoading:      z.string().optional().nullable(),
  allowedLaytimeHours:  z.coerce.number().positive().optional(),
  exceptionHours:       z.coerce.number().min(0).default(0),
  exceptions:           z.string().optional(),
  demurrageRatePerDay:  z.coerce.number().min(0).optional(),
  despatchRatePerDay:   z.coerce.number().min(0).optional(),
  demurrageStatus:      z.enum(["disputed","agreed","claimed","paid"]).optional(),
  demurrageClaimRef:    z.string().optional(),
  notes:                z.string().optional(),
}).partial();

function calcLaytime(data: Record<string, unknown>) {
  const commenced    = data.laytimeCommenced ? new Date(data.laytimeCommenced as string).getTime() : null;
  const complete     = data.completeLoading  ? new Date(data.completeLoading  as string).getTime() : null;
  const allowed      = Number(data.allowedLaytimeHours ?? 0);
  const exceptions   = Number(data.exceptionHours ?? 0);
  const demRate      = Number(data.demurrageRatePerDay ?? 0);
  const despRate     = Number(data.despatchRatePerDay  ?? 0);

  if (!commenced || !complete || !allowed) return {};

  const usedMs       = complete - commenced;
  const usedHours    = Math.max(0, usedMs / 3600000 - exceptions);
  const balance      = allowed - usedHours;
  const onDemurrage  = balance < 0;
  const onDespatch   = balance > 0;
  const demDays      = onDemurrage ? Math.abs(balance) / 24 : 0;
  const despDays     = onDespatch  ? balance / 24 : 0;
  const demAmount    = Math.round(demDays  * demRate  * 100) / 100;
  const despAmount   = Math.round(despDays * despRate * 100) / 100;
  const netAmount    = Math.round((demAmount - despAmount) * 100) / 100;

  return { usedHours: Math.round(usedHours * 100) / 100, balance: Math.round(balance * 100) / 100, onDemurrage, onDespatch, demDays: Math.round(demDays * 100) / 100, despDays: Math.round(despDays * 100) / 100, demAmount, despAmount, netDemurrageAmount: netAmount };
}

export async function GET(_: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const record = await prisma.transshipment.findUnique({ where: { id }, select: { milestones: true } });
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const m = record.milestones as Record<string, unknown> | null;
  const laytime = (Array.isArray(m) ? {} : (m?.laytime ?? {})) as Record<string, unknown>;
  return NextResponse.json({ data: { ...laytime, ...calcLaytime(laytime) } });
}

export async function PUT(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body   = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const record = await prisma.transshipment.findUnique({ where: { id }, select: { milestones: true } });
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const m     = record.milestones as Record<string, unknown> | null;
  const base  = Array.isArray(m) ? { milestoneList: m } : (m ?? {});
  const existing = (base as Record<string, unknown>).laytime ?? {};
  const merged   = { ...(existing as object), ...parsed.data, updatedAt: new Date().toISOString() };
  const computed = calcLaytime(merged);

  await prisma.transshipment.update({
    where: { id },
    data: { milestones: { ...base, laytime: { ...merged, ...computed } } },
  });

  // Surface demurrage status to main record for P&L consumption
  if (computed.netDemurrageAmount !== undefined) {
    await prisma.transshipment.update({
      where: { id },
      data: {
        demurrage: computed.demAmount > 0 ? computed.demAmount : undefined,
        despatch:  computed.despAmount > 0 ? computed.despAmount : undefined,
      },
    });
  }

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "laytime_updated", entity: "transshipment", entityId: id,
    details: { ...computed },
  });

  return NextResponse.json({ data: { ...merged, ...computed } });
}
