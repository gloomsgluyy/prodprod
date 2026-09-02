export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";
import { canMutateCommercial } from "@/lib/roles";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const deal = await prisma.deal.findUnique({ where: { id } });
  if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ data: deal });
}

const updateSchema = z.object({
  projectName:  z.string().min(1).optional(),
  buyer:        z.string().min(1).optional(),
  buyerCountry: z.string().optional(),
  segment:      z.enum(["local", "export"]).optional(),
  commodity:    z.string().optional(),
  quantity:     z.number().positive().optional(),
  pricePerMt:   z.number().positive().optional(),
  dealNumber:   z.string().optional(),
  type:         z.string().optional(),
  status:       z.enum(["waiting_approval","waiting_buyer","offer_submitted","confirmed","in_transit","completed","cancelled","rejected"]).optional(),
  specGar:      z.number().positive().optional(),
  specTs:       z.number().positive().optional(),
  specAsh:      z.number().positive().optional(),
  specTm:       z.number().positive().optional(),
  shippingTerm: z.string().optional(),
  laycanPol:    z.string().optional(),
  vesselName:   z.string().optional(),
  notes:        z.string().optional(),
}).partial();

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canMutateCommercial(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!canMutateCommercial(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const deal = await prisma.deal.update({ where: { id }, data: parsed.data });

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "updated", entity: "deal", entityId: id,
  });

  return NextResponse.json({ data: deal });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canMutateCommercial(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!canMutateCommercial(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  if (!await prisma.deal.findUnique({ where: { id }, select: { id: true } })) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.deal.delete({ where: { id } });

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "deleted", entity: "deal", entityId: id,
  });

  return new NextResponse(null, { status: 204 });
}
