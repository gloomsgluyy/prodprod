export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const APPROVER_ROLES = ["CEO", "DIRUT", "ASS_DIRUT"];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!APPROVER_ROLES.includes(session.user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const now = new Date();

  const [pendingFCOs, earlyOrRevisionSIs, pendingSourceChanges, criticalIssues] = await Promise.all([
    // FCO / Offer: projects waiting approval
    prisma.forecastProject.findMany({
      where: { status: "waiting_approval" },
      select: {
        id: true, projectName: true, buyer: true, buyerCountry: true,
        quantity: true, salesPriceEst: true, laycanStart: true, laycanEnd: true,
        roughPl: true, createdAt: true, updatedAt: true,
        createdBy: { select: { name: true, role: true } },
      },
      orderBy: { updatedAt: "asc" },
    }),

    // SI Early + SI Revision: pending SIs
    prisma.shippingInstruction.findMany({
      where: { approvalStatus: "pending" },
      select: {
        id: true, siNumber: true, version: true, isEarly: true, earlyReason: true,
        buyer: true, laycanStart: true, laycanEnd: true, quantity: true, vesselBarge: true,
        createdAt: true,
        shipment: { select: { id: true, shipmentNumber: true, buyer: true } },
      },
      orderBy: { createdAt: "asc" },
    }),

    // Source Change: pending CEO approval
    prisma.sourceChangeLog.findMany({
      where: { ceoApprovalStatus: "pending" },
      select: {
        id: true, currentSource: true, currentSupplier: true,
        newSource: true, newSupplier: true, reasonCategory: true, reasonDetail: true,
        impactDescription: true, evidenceFileUrl: true, activeVersion: true, requestDate: true,
        requestedBy: { select: { name: true, role: true } },
        shipment: { select: { id: true, shipmentNumber: true, laycanStart: true } },
      },
      orderBy: { requestDate: "asc" },
    }),

    // High Risk Issue: open critical issues without CEO acknowledgement
    prisma.shipmentIssue.findMany({
      where: {
        status: { in: ["open", "in_progress"] },
        category: { in: ["Quality issue", "Barge issue", "Loading delay"] },
      },
      select: {
        id: true, category: true, description: true, impact: true, actionPlan: true,
        targetDate: true, status: true, createdAt: true,
        pic: { select: { name: true } },
        shipment: { select: { id: true, shipmentNumber: true, buyer: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // Normalise into unified queue items
  type QueueItem = {
    id: string; type: string; title: string;
    requesterName: string; requesterRole: string;
    requestedAt: string; deadline: string | null;
    urgencyLevel: "urgent" | "normal";
    summary: string; reason: string | null; evidenceUrl: string | null;
    sourceModule: string; sourceEntityId: string;
    contextData: Record<string, unknown>;
  };

  const queue: QueueItem[] = [];

  for (const p of pendingFCOs) {
    const deadline = p.laycanStart?.toISOString() ?? null;
    const daysToLaycan = deadline ? Math.ceil((new Date(deadline).getTime() - now.getTime()) / 86400000) : 999;
    queue.push({
      id: p.id, type: "fco",
      title: `${p.projectName} — ${p.buyer}`,
      requesterName: p.createdBy.name,
      requesterRole: p.createdBy.role,
      requestedAt: p.updatedAt.toISOString(),
      deadline,
      urgencyLevel: daysToLaycan <= 3 ? "urgent" : "normal",
      summary: `Qty: ${p.quantity ? Number(p.quantity).toLocaleString() : "—"} MT | ${p.buyerCountry ?? ""}`,
      reason: null,
      evidenceUrl: null,
      sourceModule: "forecast_sales",
      sourceEntityId: p.id,
      contextData: {
        quantity: p.quantity ? Number(p.quantity) : null,
        salesPriceEst: p.salesPriceEst ? Number(p.salesPriceEst) : null,
        laycanStart: p.laycanStart,
        laycanEnd: p.laycanEnd,
        roughPl: p.roughPl,
      },
    });
  }

  for (const si of earlyOrRevisionSIs) {
    const type = si.isEarly ? "si_early" : "si_revision";
    const deadline = si.laycanStart?.toISOString() ?? null;
    const daysToLaycan = deadline ? Math.ceil((new Date(deadline).getTime() - now.getTime()) / 86400000) : 999;
    queue.push({
      id: si.id, type,
      title: `${si.siNumber} v${si.version} — ${si.shipment?.shipmentNumber ?? ""}`,
      requesterName: "Traffic Team",
      requesterRole: "TRAFFIC",
      requestedAt: si.createdAt.toISOString(),
      deadline,
      urgencyLevel: daysToLaycan <= 3 ? "urgent" : "normal",
      summary: `${si.isEarly ? `Early SI` : `Revision v${si.version}`} | ${si.buyer} | Qty: ${Number(si.quantity).toLocaleString()} MT`,
      reason: si.earlyReason ?? null,
      evidenceUrl: null,
      sourceModule: "shipment_monitor",
      sourceEntityId: si.shipment?.id ?? si.id,
      contextData: {
        shipmentId: si.shipment?.id,
        shipmentNumber: si.shipment?.shipmentNumber,
        siNumber: si.siNumber,
        version: si.version,
        isEarly: si.isEarly,
        laycanStart: si.laycanStart,
        laycanEnd: si.laycanEnd,
        vesselBarge: si.vesselBarge,
      },
    });
  }

  for (const sc of pendingSourceChanges) {
    const deadline = sc.shipment?.laycanStart?.toISOString() ?? null;
    const daysToLaycan = deadline ? Math.ceil((new Date(deadline).getTime() - now.getTime()) / 86400000) : 999;
    queue.push({
      id: sc.id, type: "source_change",
      title: `Source Change — ${sc.shipment?.shipmentNumber ?? sc.id.slice(-8)}`,
      requesterName: sc.requestedBy.name,
      requesterRole: sc.requestedBy.role,
      requestedAt: sc.requestDate.toISOString(),
      deadline,
      urgencyLevel: daysToLaycan <= 3 ? "urgent" : "normal",
      summary: `${sc.currentSource} → ${sc.newSource} | ${sc.reasonCategory}`,
      reason: sc.reasonDetail,
      evidenceUrl: sc.evidenceFileUrl ?? null,
      sourceModule: "shipment_monitor",
      sourceEntityId: sc.shipment?.id ?? sc.id,
      contextData: {
        shipmentId: sc.shipment?.id,
        shipmentNumber: sc.shipment?.shipmentNumber,
        currentSource: sc.currentSource,
        currentSupplier: sc.currentSupplier,
        newSource: sc.newSource,
        newSupplier: sc.newSupplier,
        reasonCategory: sc.reasonCategory,
        impactDescription: sc.impactDescription,
        activeVersion: sc.activeVersion,
      },
    });
  }

  for (const issue of criticalIssues) {
    const deadline = issue.targetDate?.toISOString() ?? null;
    const daysToTarget = deadline ? Math.ceil((new Date(deadline).getTime() - now.getTime()) / 86400000) : 999;
    queue.push({
      id: issue.id, type: "issue_ack",
      title: `${issue.category} — ${issue.shipment?.shipmentNumber ?? ""}`,
      requesterName: issue.pic?.name ?? "Operations Team",
      requesterRole: "TRAFFIC",
      requestedAt: issue.createdAt.toISOString(),
      deadline,
      urgencyLevel: daysToTarget <= 3 ? "urgent" : "normal",
      summary: issue.description.slice(0, 120),
      reason: issue.impact,
      evidenceUrl: null,
      sourceModule: "shipment_monitor",
      sourceEntityId: issue.shipment?.id ?? issue.id,
      contextData: {
        shipmentId: issue.shipment?.id,
        shipmentNumber: issue.shipment?.shipmentNumber,
        category: issue.category,
        impact: issue.impact,
        actionPlan: issue.actionPlan,
        picName: issue.pic?.name,
        status: issue.status,
      },
    });
  }

  // Sort: urgency first, then by requestedAt (oldest first)
  queue.sort((a, b) => {
    if (a.urgencyLevel !== b.urgencyLevel)
      return a.urgencyLevel === "urgent" ? -1 : 1;
    return new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime();
  });

  const counts = {
    total:        queue.length,
    fco:          queue.filter((i) => i.type === "fco").length,
    si:           queue.filter((i) => i.type === "si_early" || i.type === "si_revision").length,
    sourceChange: queue.filter((i) => i.type === "source_change").length,
    issueAck:     queue.filter((i) => i.type === "issue_ack").length,
    urgent:       queue.filter((i) => i.urgencyLevel === "urgent").length,
  };

  return NextResponse.json({ data: queue, counts });
}

