import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";

type Ctx = { params: Promise<{ id: string }> };

const MANDATORY_DOCS = ["b", "g", "i", "j", "k"];

export async function POST(_: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [shipment, docs, issues, siList, payments, paymentRecords, sourceChanges, bargeChanges] = await Promise.all([
    prisma.shipment.findUnique({
      where: { id },
      include: { polTimeline: true, podTimeline: true },
    }),
    prisma.shipmentDocument.findMany({ where: { shipmentId: id } }),
    prisma.shipmentIssue.findMany({ where: { shipmentId: id, status: { in: ["open", "in_progress"] } } }),
    prisma.shippingInstruction.findMany({
      where: { shipmentId: id },
      orderBy: { version: "desc" },
      take: 1,
      select: { approvalStatus: true, version: true },
    }),
    prisma.outstandingPayment.findMany({
      where: { shipmentId: id },
      select: { status: true, dueDate: true, invoiceNumber: true },
    }),
    prisma.paymentRecord.findMany({
      where: { shipmentId: id },
      select: { status: true, invoiceNumber: true },
    }),
    prisma.sourceChangeLog.findMany({
      where: { shipmentId: id, ceoApprovalStatus: { in: ["pending", "rejected"] } },
      select: { id: true, ceoApprovalStatus: true },
    }),
    prisma.bargeChangeLog.findMany({
      where: { shipmentId: id, approvalRequired: true, status: { in: ["active", "rejected"] } },
      select: { id: true, status: true },
    }),
  ]);

  if (!shipment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const blockers: { check: string; message: string }[] = [];

  // Check 1: Final quantity
  if (!shipment.qtyFinal)
    blockers.push({ check: "final_qty", message: "Final quantity not set" });

  // Check 2: BL Date
  if (!shipment.blDate)
    blockers.push({ check: "bl_date", message: "BL Date not set" });

  // Check 2b: commercial values required by old Shipment Monitor closing flow
  if (!shipment.salesPrice)
    blockers.push({ check: "sales_price", message: "Sales price is missing" });
  if (!shipment.buyingPrice)
    blockers.push({ check: "buying_price", message: "Buying price is missing" });

  // Check 3: Mandatory documents (b,g,i,j,k)
  const docMap = Object.fromEntries(docs.map((d) => [d.requirementCode, d.status]));
  for (const code of MANDATORY_DOCS) {
    if (!docMap[code] || docMap[code] === "pending") {
      blockers.push({ check: `doc_${code}`, message: `Document "${code}" not completed` });
    }
  }

  // Check 4: Open issues
  if (issues.length > 0)
    blockers.push({ check: "open_issues", message: `${issues.length} open issue(s) not resolved` });

  // Check 5: SI must exist and be approved (no pending SI) — BR-SHIP-026
  const latestSI = siList[0];
  if (!latestSI) {
    blockers.push({ check: "si_missing", message: "No Shipping Instruction issued for this shipment" });
  } else if (latestSI.approvalStatus === "pending") {
    blockers.push({ check: "si_pending", message: `SI v${latestSI.version} is still pending approval` });
  }

  // Check 6: Quality — shipment must have a linked quality result and not be in warning/claim state
  const qualityResult = await prisma.qualityResult.findFirst({
    where: { shipmentId: id },
    select: { status: true },
    orderBy: { createdAt: "desc" },
  });
  if (!qualityResult) {
    blockers.push({ check: "quality_missing", message: "No quality result linked to this shipment" });
  } else if (qualityResult.status === "warning" || qualityResult.status === "need_review") {
    blockers.push({ check: "quality_unreviewed", message: `Quality status is "${qualityResult.status}" — must be reviewed before closing` });
  } else if (qualityResult.status === "claim_potential") {
    blockers.push({ check: "quality_claim", message: "Quality has claim potential — resolve before closing" });
  }

  // Check 7: Payment — no overdue outstanding payments
  const now = new Date();
  const overduePayments = payments.filter(
    (p) => p.status !== "paid" && p.dueDate && new Date(p.dueDate) < now,
  );
  if (overduePayments.length > 0)
    blockers.push({ check: "payment_overdue", message: `${overduePayments.length} payment(s) overdue — resolve before closing` });

  // Check 8: invoice/payment readiness parity from old web
  const unpaidPaymentRecords = paymentRecords.filter((p) => p.status !== "paid");
  if (paymentRecords.length > 0 && unpaidPaymentRecords.length > 0)
    blockers.push({ check: "payment_status", message: `${unpaidPaymentRecords.length} payment record(s) not paid` });
  if (![...payments, ...paymentRecords].some((p) => p.invoiceNumber))
    blockers.push({ check: "invoice_number", message: "Invoice number is missing" });

  // Check 9: pending/rejected operational changes must be resolved before closing
  if (sourceChanges.length > 0)
    blockers.push({ check: "source_change", message: `${sourceChanges.length} source change request(s) not approved` });
  if (bargeChanges.length > 0)
    blockers.push({ check: "barge_change", message: `${bargeChanges.length} barge change request(s) not approved` });

  if (blockers.length > 0) {
    return NextResponse.json({ error: "Closing blocked", code: "CLOSING_BLOCKED", blockers }, { status: 409 });
  }

  const closed = await prisma.shipment.update({
    where: { id },
    data: { status: "completed" },
  });

  await writeAuditLog({
    userId: session.user.id, userRole: session.user.role,
    action: "closed", entity: "shipment", entityId: id, shipmentId: id,
  });

  return NextResponse.json({ data: closed });
}
