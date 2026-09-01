import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { invalidateMany } from "@/lib/cache";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string; childId: string }> };
const ROLES = ["CEO", "DIRUT", "ASS_DIRUT", "COO", "CMO", "TRADERS_1", "TRADERS_2", "TRADERS_3", "TRADERS_4", "TRAFFIC_HEAD", "TRAFFIC_1", "TRAFFIC_2", "TRAFFIC_3", "TRAFFIC_4", "ADMIN_OPERATION"];
const schema = z.object({
  bargeName: z.string().min(1).optional(), plannedQty: z.coerce.number().positive().optional(), loadedQty: z.coerce.number().min(0).optional(), finalQty: z.coerce.number().min(0).optional(), source: z.string().optional(), supplier: z.string().optional(), status: z.string().optional(), currentStage: z.string().optional(), eta: z.string().nullable().optional(), notes: z.string().optional(),
}).partial();

export async function PATCH(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ROLES.includes(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id, childId } = await params;
  const existing = await prisma.childNomination.findFirst({ where: { id: childId, motherShipmentId: id } });
  if (!existing) return NextResponse.json({ error: "Child nomination not found" }, { status: 404 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  const parent = await prisma.shipment.findFirst({ where: { id, shipmentClass: "mother_vessel" }, select: { qtyPlan: true } });
  const other = await prisma.childNomination.aggregate({ where: { motherShipmentId: id, id: { not: childId } }, _sum: { plannedQty: true } });
  if (parent?.qtyPlan != null && Number(other._sum.plannedQty ?? 0) + (parsed.data.plannedQty ?? Number(existing.plannedQty ?? 0)) > Number(parent.qtyPlan)) return NextResponse.json({ error: "Child planned quantity exceeds Mother Vessel plan" }, { status: 422 });
  const { eta, ...data } = parsed.data;
  const item = await prisma.childNomination.update({ where: { id: childId }, data: { ...data, ...(eta !== undefined ? { eta: eta ? new Date(eta) : null } : {}) } });
  await writeAuditLog({ userId: session.user.id, userRole: session.user.role, action: "updated", entity: "child_nomination", entityId: childId, shipmentId: id, details: { motherShipmentId: id, childNominationId: childId, changedFields: Object.keys(parsed.data) } });
  await invalidateMany([`shipments:workspace:${id}`, `shipments:detail:${id}`, "dashboard:shipments-active"]);
  return NextResponse.json({ data: item });
}

export async function DELETE(_: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ROLES.includes(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id, childId } = await params;
  const existing = await prisma.childNomination.findFirst({ where: { id: childId, motherShipmentId: id } });
  if (!existing) return NextResponse.json({ error: "Child nomination not found" }, { status: 404 });
  await prisma.childNomination.delete({ where: { id: childId } });
  await writeAuditLog({ userId: session.user.id, userRole: session.user.role, action: "deleted", entity: "child_nomination", entityId: childId, shipmentId: id, details: { motherShipmentId: id, childNominationId: childId } });
  await invalidateMany([`shipments:workspace:${id}`, `shipments:detail:${id}`, "dashboard:shipments-active"]);
  return new NextResponse(null, { status: 204 });
}
