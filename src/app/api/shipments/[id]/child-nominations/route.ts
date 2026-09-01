import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";
import { invalidateMany } from "@/lib/cache";

type Ctx = { params: Promise<{ id: string }> };
const WRITE_ROLES = ["CEO", "DIRUT", "ASS_DIRUT", "COO", "CMO", "TRADERS_1", "TRADERS_2", "TRADERS_3", "TRADERS_4", "TRAFFIC_HEAD", "TRAFFIC_1", "TRAFFIC_2", "TRAFFIC_3", "TRAFFIC_4", "ADMIN_OPERATION"];
const CHILD_STATUSES = ["planned", "active", "completed", "cancelled"] as const;
const CHILD_STAGES = ["allocation", "contract", "nomination", "standby_loading_port", "loading", "sailing_to_loading_port", "documents", "invoice", "settlement", "result"] as const;
const schema = z.object({
  nominationNumber: z.string().min(1), bargeName: z.string().min(1), tugBoatName: z.string().optional(), dwt: z.coerce.number().positive().optional(), nominationDate: z.string().optional(), nominatedBy: z.string().optional(), loadingPort: z.string().optional(), laycanStart: z.string().optional(), laycanEnd: z.string().optional(), tolerancePercent: z.coerce.number().min(0).max(100).optional(), lhvIssued: z.boolean().optional(), lhvIssuedDate: z.string().optional(), blDate: z.string().optional(),
  plannedQty: z.coerce.number().positive().optional(), loadedQty: z.coerce.number().min(0).optional(), finalQty: z.coerce.number().min(0).optional(),
  source: z.string().optional(), supplier: z.string().optional(), iupOp: z.string().optional(), contractNo: z.string().optional(), contractStatus: z.string().optional(), softcopyStatus: z.string().optional(), hardcopyStatus: z.string().optional(), opsApproval: z.string().optional(), qaApproval: z.string().optional(), legalApproval: z.string().optional(), royaltyBillingId: z.string().optional(), royaltyQty: z.coerce.number().min(0).optional(), royaltyAmount: z.coerce.number().min(0).optional(), invoiceCount: z.coerce.number().int().min(0).optional(), invoiceAmount: z.coerce.number().min(0).optional(), invoiceStatus: z.string().optional(), freightRate: z.coerce.number().min(0).optional(), allowance: z.coerce.number().min(0).optional(), demurrage: z.coerce.number().min(0).optional(), despatch: z.coerce.number().min(0).optional(), laytimeResult: z.string().optional(), pebStatus: z.string().optional(), legalStatus: z.string().optional(), qualityResult: z.record(z.unknown()).optional(), communicationLog: z.array(z.record(z.unknown())).optional(), status: z.enum(CHILD_STATUSES).optional(), currentStage: z.enum(CHILD_STAGES).optional(), eta: z.string().optional(), notes: z.string().optional(),
});

async function parent(id: string) { return prisma.shipment.findFirst({ where: { id, shipmentClass: "mother_vessel" }, select: { id: true, vesselName: true, qtyPlan: true } }); }

export async function GET(_: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions); if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params; if (!await parent(id)) return NextResponse.json({ error: "Mother Vessel not found" }, { status: 404 });
  const items = await prisma.childNomination.findMany({ where: { motherShipmentId: id }, orderBy: { updatedAt: "desc" } });
  return NextResponse.json({ data: items.map((item) => ({ ...item, plannedQty: item.plannedQty == null ? null : Number(item.plannedQty), loadedQty: item.loadedQty == null ? null : Number(item.loadedQty), finalQty: item.finalQty == null ? null : Number(item.finalQty) })) });
}

export async function POST(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions); if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!WRITE_ROLES.includes(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params; const shipment = await parent(id); if (!shipment) return NextResponse.json({ error: "Mother Vessel not found" }, { status: 404 });
  const parsed = schema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  const allocated = await prisma.childNomination.aggregate({ where: { motherShipmentId: id }, _sum: { plannedQty: true } });
  if (shipment.qtyPlan != null && Number(allocated._sum.plannedQty ?? 0) + (parsed.data.plannedQty ?? 0) > Number(shipment.qtyPlan)) return NextResponse.json({ error: "Child planned quantity exceeds Mother Vessel plan" }, { status: 422 });
  const { eta, nominationDate, laycanStart, laycanEnd, lhvIssuedDate, blDate, qualityResult, communicationLog, ...data } = parsed.data;
  const item = await prisma.childNomination.create({ data: { ...data, ...(qualityResult !== undefined ? { qualityResult: qualityResult as never } : {}), ...(communicationLog !== undefined ? { communicationLog: communicationLog as never } : {}), eta: eta ? new Date(eta) : undefined, nominationDate: nominationDate ? new Date(nominationDate) : undefined, laycanStart: laycanStart ? new Date(laycanStart) : undefined, laycanEnd: laycanEnd ? new Date(laycanEnd) : undefined, lhvIssuedDate: lhvIssuedDate ? new Date(lhvIssuedDate) : undefined, blDate: blDate ? new Date(blDate) : undefined, motherShipmentId: id, createdById: session.user.id } });
  await writeAuditLog({ userId: session.user.id, userRole: session.user.role, action: "created", entity: "child_nomination", entityId: item.id, shipmentId: id, details: { motherShipmentId: id, nominationNumber: item.nominationNumber } });
  await invalidateMany([`shipments:workspace:${id}`, `shipments:detail:${id}`, "dashboard:shipments-active"]);
  return NextResponse.json({ data: item }, { status: 201 });
}
