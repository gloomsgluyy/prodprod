import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const shipment = await prisma.shipment.findFirst({
    where: { id, shipmentClass: "mother_vessel" },
    include: {
      project: { select: { id: true, projectName: true, entity: true, buyer: true, buyerCountry: true, segment: true, quantity: true, quantityUnit: true, salesPriceEst: true, fcoNumber: true, fcoVersion: true, paymentTerm: true, priceBasis: true, templateType: true } },
      polTimeline: true,
      podTimeline: true,
      siHistory: { orderBy: { version: "desc" }, take: 10, select: { id: true, siNumber: true, version: true, approvalStatus: true, pdfUrl: true, createdAt: true } },
    },
  });
  if (!shipment) return NextResponse.json({ error: "Mother Vessel not found" }, { status: 404 });
  const [children, issues, documents, payments, quality] = await Promise.all([
    prisma.childNomination.findMany({ where: { motherShipmentId: id }, orderBy: { updatedAt: "desc" } }),
    prisma.shipmentIssue.findMany({ where: { shipmentId: id, status: { in: ["open", "in_progress"] } }, orderBy: { createdAt: "desc" }, take: 5, select: { id: true, category: true, description: true, status: true, targetDate: true } }),
    prisma.shipmentDocument.findMany({ where: { shipmentId: id }, select: { requirementCode: true, status: true, files: { where: { isDeleted: false }, select: { id: true }, take: 1 } } }),
    prisma.paymentRecord.findMany({ where: { shipmentId: id }, select: { id: true, status: true, dueDate: true, invoiceNumber: true, amount: true, currency: true } }),
    prisma.qualityResult.findFirst({ where: { shipmentId: id }, orderBy: { createdAt: "desc" }, select: { id: true, status: true, surveyor: true, samplingDate: true, specResult: true, contractSpec: true, coaPodResult: true, coaPolResult: true, warningNotes: true } }),
  ]);
  const childQty = (field: "plannedQty" | "loadedQty" | "finalQty") => children.reduce((sum, child) => sum + Number(child[field] ?? 0), 0);
  const allocatedQty = childQty("plannedQty");
  const childLoadedQty = childQty("loadedQty");
  const actualLoadedQty = childLoadedQty || Number(shipment.qtyLoaded ?? 0);
  const pendingDocuments = documents.filter((document) => !["completed", "not_required"].includes(document.status) || document.files.length === 0).length;
  const progress = [
    { key: "forecast", label: "Sales Forecast", complete: !!shipment.projectId },
    { key: "buyer", label: "Buyer Confirmation", complete: !!shipment.buyer },
    { key: "supplier", label: "Supplier Allocation", complete: allocatedQty > 0 && allocatedQty <= Number(shipment.qtyPlan ?? 0) },
    { key: "barge", label: "Barge Loading", complete: childLoadedQty > 0 },
    { key: "mv", label: "Mother Vessel Loading", complete: !!shipment.polTimeline?.completeLoading || ["in_transit", "completed"].includes(shipment.status) },
    { key: "documents", label: "Documents", complete: pendingDocuments === 0 },
    { key: "payment", label: "Payment", complete: payments.length > 0 && payments.every((payment) => payment.status === "paid") },
  ];
  const criticalIssueCount = issues.filter((issue) => ["critical", "Critical"].includes(issue.category)).length;
  const overduePayments = payments.filter((payment) => payment.status !== "paid" && payment.dueDate && payment.dueDate < new Date()).length;
  const serialPayments = payments.map((payment) => ({ ...payment, amount: Number(payment.amount) }));
  return NextResponse.json({ data: { shipment, children, issues, documents, payments: serialPayments, quality, progress, summary: { buyerQtyPlan: Number(shipment.qtyPlan ?? 0), allocatedQty, actualLoadedQty, childLoadedQty, childFinalQty: childQty("finalQty"), remainingQty: Number(shipment.qtyPlan ?? 0) - allocatedQty, bargeCompleted: children.filter((child) => ["completed", "loaded"].includes(child.status)).length, bargeTotal: children.length, openIssueCount: issues.length, criticalIssueCount, pendingDocuments, overduePayments, qualityStatus: quality?.status ?? null, overallStatus: criticalIssueCount ? "critical" : issues.length ? "at_risk" : shipment.status === "completed" ? "complete" : "in_progress" } } });
}
