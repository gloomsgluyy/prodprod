import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const shipment = await prisma.shipment.findFirst({ where: { id, shipmentClass: "mother_vessel" } });
  if (!shipment) return NextResponse.json({ error: "Mother Vessel not found" }, { status: 404 });
  const [children, issues, documents, payments, quality] = await Promise.all([
    prisma.childNomination.findMany({ where: { motherShipmentId: id }, orderBy: { updatedAt: "desc" } }),
    prisma.shipmentIssue.findMany({ where: { shipmentId: id, status: { in: ["open", "in_progress"] } }, orderBy: { createdAt: "desc" }, take: 5, select: { id: true, category: true, description: true, status: true, targetDate: true } }),
    prisma.shipmentDocument.findMany({ where: { shipmentId: id }, select: { requirementCode: true, status: true, files: { where: { isDeleted: false }, select: { id: true }, take: 1 } } }),
    prisma.outstandingPayment.findMany({ where: { shipmentId: id }, select: { id: true, status: true, dueDate: true, invoiceNumber: true } }),
    prisma.qualityResult.findFirst({ where: { shipmentId: id }, orderBy: { createdAt: "desc" }, select: { status: true } }),
  ]);
  const childQty = (field: "plannedQty" | "loadedQty" | "finalQty") => children.reduce((sum, child) => sum + Number(child[field] ?? 0), 0);
  return NextResponse.json({ data: { shipment, children, issues, documents, payments, quality, summary: { allocatedQty: childQty("plannedQty"), childLoadedQty: childQty("loadedQty"), childFinalQty: childQty("finalQty"), openIssueCount: issues.length, pendingDocuments: documents.filter((document) => !["completed", "not_required"].includes(document.status) || document.files.length === 0).length, overduePayments: payments.filter((payment) => payment.status !== "paid" && payment.dueDate && payment.dueDate < new Date()).length, qualityStatus: quality?.status ?? null } } });
}
