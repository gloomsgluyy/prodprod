import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isExecutive } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ id: string; childId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, childId } = await params;
  const child = await prisma.childNomination.findFirst({ where: { id: childId, motherShipmentId: id }, include: { motherShipment: { select: { id: true, shipmentNumber: true, vesselName: true, buyer: true, project: { select: { projectName: true, entity: true, fcoNumber: true } } } } } });
  if (!child) return NextResponse.json({ error: "Barge line not found" }, { status: 404 });
  const [siblings, issues, documents, quality, payments, operations] = await Promise.all([
    prisma.childNomination.findMany({ where: { motherShipmentId: id }, orderBy: { updatedAt: "desc" }, select: { id: true, nominationNumber: true } }),
    prisma.shipmentIssue.findMany({ where: { shipmentId: id, status: { in: ["open", "in_progress"] } }, orderBy: { createdAt: "desc" }, take: 10, select: { id: true, category: true, description: true, status: true } }),
    prisma.shipmentDocument.findMany({ where: { shipmentId: id }, select: { requirementCode: true, label: true, status: true, files: { where: { isDeleted: false }, select: { id: true, originalName: true, publicUrl: true, visibility: true } } } }),
    prisma.qualityResult.findFirst({ where: { shipmentId: id }, orderBy: { createdAt: "desc" }, select: { status: true, surveyor: true, samplingDate: true, specResult: true, coaPolResult: true, coaPodResult: true, warningNotes: true } }),
    prisma.paymentRecord.findMany({ where: { shipmentId: id }, select: { id: true, invoiceNumber: true, amount: true, status: true, dueDate: true } }),
    prisma.transshipment.findMany({ where: { shipmentId: id }, orderBy: { updatedAt: "desc" }, select: { id: true, vesselName: true, bargeName: true, loadingPort: true, freightRate: true, allowance: true, demurrage: true, despatch: true, eta: true, status: true } }),
  ]);
  const plan = Number(child.plannedQty ?? 0);
  const actual = Number(child.loadedQty ?? 0);
  const variance = actual - plan;
  const variancePercent = plan ? variance / plan * 100 : null;
  const tolerance = Number(child.tolerancePercent ?? 5);
  const childIndex = siblings.findIndex((item) => item.id === child.id);
  const financialOperations = isExecutive(session.user.role) ? operations.map((operation) => ({ ...operation, freightRate: operation.freightRate == null ? null : Number(operation.freightRate), allowance: operation.allowance == null ? null : Number(operation.allowance), demurrage: operation.demurrage == null ? null : Number(operation.demurrage), despatch: operation.despatch == null ? null : Number(operation.despatch) })) : [];
  return NextResponse.json({ data: { child: { ...child, plannedQty: child.plannedQty == null ? null : Number(child.plannedQty), loadedQty: child.loadedQty == null ? null : Number(child.loadedQty), finalQty: child.finalQty == null ? null : Number(child.finalQty), dwt: child.dwt == null ? null : Number(child.dwt), royaltyQty: child.royaltyQty == null ? null : Number(child.royaltyQty), royaltyAmount: child.royaltyAmount == null ? null : Number(child.royaltyAmount), invoiceAmount: child.invoiceAmount == null ? null : Number(child.invoiceAmount), freightRate: child.freightRate == null ? null : Number(child.freightRate), allowance: child.allowance == null ? null : Number(child.allowance), demurrage: child.demurrage == null ? null : Number(child.demurrage), despatch: child.despatch == null ? null : Number(child.despatch) }, parent: child.motherShipment, siblings, previousId: siblings[childIndex - 1]?.id ?? null, nextId: siblings[childIndex + 1]?.id ?? null, issues, documents, quality: isExecutive(session.user.role) ? quality : quality ? { status: quality.status, surveyor: quality.surveyor, samplingDate: quality.samplingDate, warningNotes: quality.warningNotes } : null, payments: payments.map((payment) => ({ ...payment, amount: payment.amount == null ? null : Number(payment.amount) })), operations: financialOperations, summary: { planQty: plan, actualQty: actual, variance, variancePercent, tolerance, withinTolerance: variancePercent == null || Math.abs(variancePercent) <= tolerance, documentCount: documents.reduce((count, document) => count + document.files.length, 0), pendingDocuments: documents.filter((document) => !["completed", "not_required"].includes(document.status)).length } } });
}
