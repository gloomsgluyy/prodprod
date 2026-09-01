import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { invalidateMany } from "@/lib/cache";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string; childId: string }> };
const ROLES = ["CEO", "DIRUT", "ASS_DIRUT", "COO", "CMO", "TRADERS_1", "TRADERS_2", "TRADERS_3", "TRADERS_4", "TRAFFIC_HEAD", "TRAFFIC_1", "TRAFFIC_2", "TRAFFIC_3", "TRAFFIC_4", "ADMIN_OPERATION"];
const CHILD_STATUSES = ["planned", "active", "completed", "cancelled"] as const;
const CHILD_STAGES = ["allocation", "contract", "nomination", "standby_loading_port", "loading", "sailing_to_loading_port", "documents", "invoice", "settlement", "result"] as const;
const schema = z.object({
  bargeName: z.string().min(1).optional(), tugBoatName: z.string().optional(), dwt: z.coerce.number().positive().optional(), nominationDate: z.string().optional(), nominatedBy: z.string().optional(), loadingPort: z.string().optional(), laycanStart: z.string().optional(), laycanEnd: z.string().optional(), tolerancePercent: z.coerce.number().min(0).max(100).optional(), lhvIssued: z.boolean().optional(), lhvIssuedDate: z.string().nullable().optional(), blDate: z.string().nullable().optional(), plannedQty: z.coerce.number().positive().optional(), loadedQty: z.coerce.number().min(0).optional(), finalQty: z.coerce.number().min(0).optional(), source: z.string().optional(), supplier: z.string().optional(), iupOp: z.string().optional(), contractNo: z.string().optional(), contractStatus: z.string().optional(), softcopyStatus: z.string().optional(), hardcopyStatus: z.string().optional(), opsApproval: z.string().optional(), qaApproval: z.string().optional(), legalApproval: z.string().optional(), royaltyBillingId: z.string().optional(), royaltyQty: z.coerce.number().min(0).optional(), royaltyAmount: z.coerce.number().min(0).optional(), invoiceCount: z.coerce.number().int().min(0).optional(), invoiceAmount: z.coerce.number().min(0).optional(), invoiceStatus: z.string().optional(), freightRate: z.coerce.number().min(0).optional(), allowance: z.coerce.number().min(0).optional(), demurrage: z.coerce.number().min(0).optional(), despatch: z.coerce.number().min(0).optional(), laytimeResult: z.string().optional(), pebStatus: z.string().optional(), legalStatus: z.string().optional(), qualityResult: z.record(z.unknown()).optional(), communicationLog: z.array(z.record(z.unknown())).optional(), status: z.enum(CHILD_STATUSES).optional(), currentStage: z.enum(CHILD_STAGES).optional(), eta: z.string().nullable().optional(), notes: z.string().optional(),
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
  if (parsed.data.status === "cancelled" && !parsed.data.notes?.trim()) return NextResponse.json({ error: "Cancellation reason is required in notes" }, { status: 422 });
  if (parsed.data.currentStage && existing.currentStage) {
    const oldIndex = CHILD_STAGES.indexOf(existing.currentStage as typeof CHILD_STAGES[number]);
    const newIndex = CHILD_STAGES.indexOf(parsed.data.currentStage);
    if (oldIndex >= 0 && newIndex >= 0 && newIndex < oldIndex && !parsed.data.notes?.trim()) return NextResponse.json({ error: "Stage cannot move backward without a reason" }, { status: 409 });
  }
  const parent = await prisma.shipment.findFirst({ where: { id, shipmentClass: "mother_vessel" }, select: { qtyPlan: true } });
  const other = await prisma.childNomination.aggregate({ where: { motherShipmentId: id, id: { not: childId } }, _sum: { plannedQty: true } });
  if (parent?.qtyPlan != null && Number(other._sum.plannedQty ?? 0) + (parsed.data.plannedQty ?? Number(existing.plannedQty ?? 0)) > Number(parent.qtyPlan)) return NextResponse.json({ error: "Child planned quantity exceeds Mother Vessel plan" }, { status: 422 });
  const { eta, nominationDate, laycanStart, laycanEnd, lhvIssuedDate, blDate, qualityResult, communicationLog, ...data } = parsed.data;
  const item = await prisma.childNomination.update({ where: { id: childId }, data: { ...data, ...(qualityResult !== undefined ? { qualityResult: qualityResult as never } : {}), ...(communicationLog !== undefined ? { communicationLog: communicationLog as never } : {}), ...(eta !== undefined ? { eta: eta ? new Date(eta) : null } : {}), ...(nominationDate !== undefined ? { nominationDate: nominationDate ? new Date(nominationDate) : null } : {}), ...(laycanStart !== undefined ? { laycanStart: laycanStart ? new Date(laycanStart) : null } : {}), ...(laycanEnd !== undefined ? { laycanEnd: laycanEnd ? new Date(laycanEnd) : null } : {}), ...(lhvIssuedDate !== undefined ? { lhvIssuedDate: lhvIssuedDate ? new Date(lhvIssuedDate) : null } : {}), ...(blDate !== undefined ? { blDate: blDate ? new Date(blDate) : null } : {}) } });
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
